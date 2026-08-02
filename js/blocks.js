/* ============================================================================
 * blocks.js — Der Block-Editor
 * ----------------------------------------------------------------------------
 * Alles ist ein Block. Ein Absatz ist ein Block, eine Überschrift ist ein
 * Block, eine Unterseite ist ein Block, eine Datenbank ist ein Block.
 * Genau wie bei Notion.
 *
 * Dieser Datei gehört:
 *   - der Katalog aller Blocktypen (mit Slash-Befehl und Tastenkürzel)
 *   - das Rendern eines Blocks ins DOM
 *   - die Tastatursteuerung im Editor
 *   - das Slash-Menü
 *   - die Markdown-Kürzel beim Tippen
 *   - das Block-Handle-Menü
 * ==========================================================================*/

const Blocks = (() => {

  /* ========================================================================
   * DER KATALOG
   * ------------------------------------------------------------------------
   * gruppe   – Überschrift im Slash-Menü
   * cmd      – die Wörter, auf die der Slash-Befehl reagiert
   * kurz     – Tastenkürzel, das den Blocktyp setzt
   * md       – Markdown-Kürzel, das beim Tippen sofort umwandelt
   * ======================================================================*/
  const TYPEN = [
    /* --- Grundlegende Blöcke ------------------------------------------- */
    { id:'text',    name:'Text',              icon:'¶',  gruppe:'Grundlegend', cmd:['text','absatz','p'],            kurz:'Ctrl+Alt+0', ph:'Tippe etwas, oder drücke / für Befehle' },
    { id:'h1',      name:'Überschrift 1',     icon:'H₁', gruppe:'Grundlegend', cmd:['h1','ueberschrift1','titel'],   kurz:'Ctrl+Alt+1', md:'#',    ph:'Überschrift 1' },
    { id:'h2',      name:'Überschrift 2',     icon:'H₂', gruppe:'Grundlegend', cmd:['h2','ueberschrift2'],           kurz:'Ctrl+Alt+2', md:'##',   ph:'Überschrift 2' },
    { id:'h3',      name:'Überschrift 3',     icon:'H₃', gruppe:'Grundlegend', cmd:['h3','ueberschrift3'],           kurz:'Ctrl+Alt+3', md:'###',  ph:'Überschrift 3' },
    { id:'todo',    name:'Aufgabenliste',     icon:'☑',  gruppe:'Grundlegend', cmd:['todo','aufgabe','checkbox'],    kurz:'Ctrl+Alt+4', md:['[]','[ ]'], ph:'Aufgabe' },
    { id:'bullet',  name:'Aufzählungsliste',  icon:'•',  gruppe:'Grundlegend', cmd:['bullet','liste','aufzaehlung'], kurz:'Ctrl+Alt+5', md:['-','*','+'], ph:'Listenpunkt' },
    { id:'number',  name:'Nummerierte Liste', icon:'1.', gruppe:'Grundlegend', cmd:['number','nummeriert'],          kurz:'Ctrl+Alt+6', md:'1.',   ph:'Listenpunkt' },
    { id:'toggle',  name:'Toggle-Liste',      icon:'▸',  gruppe:'Grundlegend', cmd:['toggle','einklappbar'],         kurz:'Ctrl+Alt+7', md:'>',    ph:'Toggle' },
    { id:'toggle-h1', name:'Toggle-Überschrift 1', icon:'▸H₁', gruppe:'Grundlegend', cmd:['toggle h1','einklappbare ueberschrift 1'] },
    { id:'toggle-h2', name:'Toggle-Überschrift 2', icon:'▸H₂', gruppe:'Grundlegend', cmd:['toggle h2','einklappbare ueberschrift 2'] },
    { id:'toggle-h3', name:'Toggle-Überschrift 3', icon:'▸H₃', gruppe:'Grundlegend', cmd:['toggle h3','einklappbare ueberschrift 3'] },
    { id:'quote',   name:'Zitat',             icon:'❝',  gruppe:'Grundlegend', cmd:['quote','zitat'],                md:'"',    ph:'Zitat' },
    { id:'callout', name:'Callout',           icon:'💡', gruppe:'Grundlegend', cmd:['callout','hinweis'],            ph:'Hinweis' },
    { id:'divider', name:'Trennlinie',        icon:'—',  gruppe:'Grundlegend', cmd:['divider','trennlinie','hr'],    md:['---','***','___'] },

    /* --- Datenbanken ---------------------------------------------------- */
    { id:'db-table',    name:'Tabelle',    icon:'▦', gruppe:'Datenbank', cmd:['tabelle','table','datenbank'] },
    { id:'db-board',    name:'Board',      icon:'▤', gruppe:'Datenbank', cmd:['board','kanban'] },
    { id:'db-list',     name:'Liste',      icon:'☰', gruppe:'Datenbank', cmd:['listenansicht','list'] },
    { id:'db-gallery',  name:'Galerie',    icon:'▩', gruppe:'Datenbank', cmd:['galerie','gallery'] },
    { id:'db-calendar', name:'Kalender',   icon:'📅', gruppe:'Datenbank', cmd:['kalender','calendar'] },

    /* --- Medien ---------------------------------------------------------- */
    { id:'image',    name:'Bild',       icon:'🖼', gruppe:'Medien', cmd:['bild','image','foto'] },
    { id:'video',    name:'Video',      icon:'🎬', gruppe:'Medien', cmd:['video'] },
    { id:'audio',    name:'Audio',      icon:'🔊', gruppe:'Medien', cmd:['audio','ton'] },
    { id:'file',     name:'Datei',      icon:'📎', gruppe:'Medien', cmd:['datei','file','anhang'] },
    { id:'bookmark', name:'Lesezeichen',icon:'🔖', gruppe:'Medien', cmd:['bookmark','lesezeichen','link'] },
    { id:'embed',    name:'Einbetten',  icon:'⧉',  gruppe:'Medien', cmd:['embed','einbetten','iframe'] },

    /* --- Erweitert -------------------------------------------------------- */
    { id:'code',       name:'Code',              icon:'⌨',  gruppe:'Erweitert', cmd:['code'], kurz:'Ctrl+Alt+8', md:'```', ph:'Code' },
    { id:'equation',   name:'Formel',            icon:'∑',  gruppe:'Erweitert', cmd:['formel','equation','math','latex'], md:'$$', ph:'E = mc^2' },
    { id:'table',      name:'Einfache Tabelle',  icon:'⊞',  gruppe:'Erweitert', cmd:['tabelle einfach','simple table','raster'] },
    { id:'toc',        name:'Inhaltsverzeichnis',icon:'≡',  gruppe:'Erweitert', cmd:['inhaltsverzeichnis','toc'] },
    { id:'breadcrumb', name:'Pfad',              icon:'⌂',  gruppe:'Erweitert', cmd:['pfad','breadcrumb'] },
    { id:'columns',    name:'Zwei Spalten',      icon:'⫿',  gruppe:'Erweitert', cmd:['spalten','columns'] },
    { id:'columns3',   name:'Drei Spalten',      icon:'⫼',  gruppe:'Erweitert', cmd:['dreispalten','columns3'] },
    { id:'page',       name:'Unterseite',        icon:'📄', gruppe:'Erweitert', cmd:['seite','page','unterseite'], kurz:'Ctrl+Alt+9' },
    { id:'pageref',    name:'Link zu Seite',     icon:'↗',  gruppe:'Erweitert', cmd:['link zu seite','verweis','klon','pageref'] },
    { id:'synced',     name:'Synchronisierter Block', icon:'⇄', gruppe:'Erweitert', cmd:['synced','synchron','spiegel'] },
    { id:'linkeddb',   name:'Verknüpfte Ansicht', icon:'⧉', gruppe:'Datenbank', cmd:['verknuepfte ansicht','linked','ansicht einer datenbank'] },
    { id:'button',     name:'Knopf',             icon:'🔘', gruppe:'Erweitert', cmd:['button','knopf','vorlagenknopf'] },
    { id:'html',       name:'HTML',              icon:'</>',gruppe:'Erweitert', cmd:['html'] },

    /* --- Wissen ------------------------------------------------------------ */
    { id:'flashcard',  name:'Karteikarte',       icon:'🎴', gruppe:'Wissen', cmd:['karteikarte','flashcard','lernen'], ph:'Frage :: Antwort' },
    { id:'whiteboard', name:'Whiteboard',        icon:'🖍', gruppe:'Wissen', cmd:['whiteboard','zeichnen','canvas','skizze'] },
    { id:'chart',      name:'Diagramm',          icon:'📊', gruppe:'Wissen', cmd:['diagramm','chart','balken','torte'] },
    { id:'backlinks',  name:'Rückverweise',      icon:'🔙', gruppe:'Wissen', cmd:['rueckverweise','backlinks'] },

    /* --- KI --------------------------------------------------------------- */
    { id:'ai-write',   name:'KI: Text schreiben',    icon:'✨', gruppe:'KI', cmd:['ki','ai','schreiben'] },
    { id:'ai-summary', name:'KI: Zusammenfassen',    icon:'✨', gruppe:'KI', cmd:['zusammenfassen','summary'] },
    { id:'ai-todo',    name:'KI: Aufgaben ableiten', icon:'✨', gruppe:'KI', cmd:['aufgaben','actionitems'] },
    { id:'ai-translate',name:'KI: Übersetzen',       icon:'✨', gruppe:'KI', cmd:['uebersetzen','translate'] },
    { id:'ai-improve', name:'KI: Text verbessern',   icon:'✨', gruppe:'KI', cmd:['verbessern','umschreiben','improve'] }
  ];

  /* ========================================================================
   * EINBETTUNGEN
   * ------------------------------------------------------------------------
   * In Notion hat jeder Dienst einen eigenen Eintrag im Slash-Menü, obwohl
   * darunter immer derselbe Einbettungsblock steckt. Genauso hier: der Dienst
   * merkt sich nur, wie die normale Adresse in eine Einbettungsadresse
   * umgeschrieben wird. Alles ohne Schlüssel und ohne fremden Dienst.
   * ======================================================================*/
  const DIENSTE = [
    { id:'youtube',    name:'YouTube',       icon:'▶',  hinweis:'youtube.com/watch?v=…',
      um: u => { const m = u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{6,})/);
                 return m ? 'https://www.youtube.com/embed/' + m[1] : u; } },
    { id:'vimeo',      name:'Vimeo',         icon:'▶',  hinweis:'vimeo.com/123456',
      um: u => { const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                 return m ? 'https://player.vimeo.com/video/' + m[1] : u; } },
    { id:'maps',       name:'Google Maps',   icon:'🗺', hinweis:'Adresse oder Maps-Link',
      um: u => /^https?:/.test(u)
             ? (u.includes('output=embed') ? u : u + (u.includes('?') ? '&' : '?') + 'output=embed')
             : 'https://www.google.com/maps?q=' + encodeURIComponent(u) + '&output=embed' },
    { id:'drive',      name:'Google Drive',  icon:'📁', hinweis:'drive.google.com/file/d/…',
      um: u => u.replace(/\/(view|edit)(\?.*)?$/, '/preview') },
    { id:'gdocs',      name:'Google Docs',   icon:'📝', hinweis:'docs.google.com/document/d/…',
      um: u => u.replace(/\/edit(\?.*)?$/, '/preview') },
    { id:'figma',      name:'Figma',         icon:'🎨', hinweis:'figma.com/file/…',
      um: u => u.includes('figma.com/embed') ? u
             : 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(u) },
    { id:'miro',       name:'Miro',          icon:'🧲', hinweis:'miro.com/app/board/…',
      um: u => u.replace('/app/board/', '/app/live-embed/') },
    { id:'excalidraw', name:'Excalidraw',    icon:'✏',  hinweis:'excalidraw.com/#json=…', um: u => u },
    { id:'loom',       name:'Loom',          icon:'🎥', hinweis:'loom.com/share/…',
      um: u => u.replace('/share/', '/embed/') },
    { id:'spotify',    name:'Spotify',       icon:'🎧', hinweis:'open.spotify.com/track/…',
      um: u => u.replace(/open\.spotify\.com\/(?!embed)/, 'open.spotify.com/embed/') },
    { id:'soundcloud', name:'SoundCloud',    icon:'🔊', hinweis:'soundcloud.com/…',
      um: u => u.includes('w.soundcloud.com') ? u
             : 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u) },
    { id:'twitter',    name:'X (Twitter)',   icon:'𝕏',  hinweis:'x.com/name/status/…',
      um: u => { const m = u.match(/status\/(\d+)/);
                 return m ? 'https://platform.twitter.com/embed/Tweet.html?id=' + m[1] : u; } },
    { id:'gist',       name:'GitHub Gist',   icon:'🐙', hinweis:'gist.github.com/…',
      um: u => u.replace(/\/?$/, '').replace(/\.pibb$/, '') + '.pibb' },
    { id:'codepen',    name:'CodePen',       icon:'🖊', hinweis:'codepen.io/name/pen/…',
      um: u => u.replace('/pen/', '/embed/') },
    { id:'typeform',   name:'Typeform',      icon:'📋', hinweis:'form.typeform.com/to/…', um: u => u },
    { id:'canva',      name:'Canva',         icon:'🖼', hinweis:'canva.com/design/…',
      um: u => u.includes('embed') ? u : u.replace(/\/view.*$/, '/view?embed') },
    { id:'pdf',        name:'PDF',           icon:'📕', hinweis:'Adresse einer PDF-Datei', um: u => u }
  ];

  DIENSTE.forEach(d => TYPEN.push({
    id: 'embed-' + d.id, name: d.name, icon: d.icon, gruppe: 'Einbetten',
    cmd: [d.id, d.name.toLowerCase(), 'einbetten ' + d.id]
  }));

  const dienst = (id) => DIENSTE.find(d => d.id === id);

  /** Aus einer normalen Adresse die Adresse machen, die im Rahmen läuft. */
  const einbettungsAdresse = (dienstId, url) => {
    const d = dienst(dienstId);
    const u = String(url || '').trim();
    if (!d) return u;
    try { return d.um(u); } catch { return u; }
  };

  const typ = (id) => TYPEN.find(t => t.id === id) || TYPEN[0];

  /* Die Blocktypen, in die man einen bestehenden Block umwandeln kann. */
  const UMWANDELBAR = ['text','h1','h2','h3','todo','bullet','number','toggle','quote','callout',
                       'code','equation','flashcard','page'];

  /* ========================================================================
   * HILFEN
   * ======================================================================*/
  const esc = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  /** Wandelt gespeicherten Text in Anzeige-HTML um (Fett, Kursiv, Code, Links). */
  const inline = (s) => {
    let h = esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|\W)\*(.+?)\*(\W|$)/g, '$1<i>$2</i>$3')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    /* Inline-Formel $a^2$ — der kleine Mathe-Satz aus canvas.js */
    if (window.Zusatz) h = h.replace(/\$([^$\n]{1,120})\$/g, (_, f) => Zusatz.mathe(f));

    /* Datumserwähnung @2026-08-02 */
    h = h.replace(/(^|[\s(])@(\d{4}-\d{2}-\d{2})/g, (_, vor, d) =>
      `${vor}<span class="datum" title="${d}">📅 ${new Date(d + 'T12:00:00').toLocaleDateString('de-DE')}</span>`);

    /* Seitenlinks [[…]], Schlagwörter #… und Blockverweise ((…)) */
    return window.Links ? Links.inline(h) : h;
  };

  /* Cursor ans Ende eines Elements setzen */
  const cursorAnsEnde = (el) => {
    el.focus();
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  };

  /* Steht der Cursor ganz am Anfang des Blocks? */
  const amAnfang = (el) => {
    const s = getSelection();
    if (!s.rangeCount) return false;
    const r = s.getRangeAt(0).cloneRange();
    r.selectNodeContents(el);
    r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset);
    return r.toString().length === 0;
  };

  const amEnde = (el) => {
    const s = getSelection();
    if (!s.rangeCount) return false;
    const r = s.getRangeAt(0).cloneRange();
    r.selectNodeContents(el);
    r.setStart(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
    return r.toString().length === 0;
  };

  /* ========================================================================
   * RENDERN
   * ======================================================================*/

  /** Baut das DOM für einen Block samt Kindern. */
  const render = (block, tiefe = 0) => {
    const t = typ(block.type);
    const el = document.createElement('div');
    el.className = 'blk b-' + block.type;
    el.dataset.id = block.type;
    el.dataset.bid = block.id;

    /* Der Griff links: Plus und Sechs-Punkte */
    const griffe = document.createElement('div');
    griffe.className = 'handles';
    griffe.innerHTML =
      '<button data-act="add" title="Block darunter einfügen">+</button>' +
      '<button data-act="menu" title="Ziehen zum Verschieben, Klick für Optionen">⋮⋮</button>';
    el.appendChild(griffe);

    /* Der Inhalt — je nach Typ verschieden */
    const box = document.createElement('div');
    box.style.cssText = 'flex:1; min-width:0; display:flex; align-items:flex-start';
    el.appendChild(box);

    /* Ist die Seite gegen Bearbeiten gesperrt? Dann nur lesen. */
    const seite = App.aktuelleSeite ? Store.getBlock(App.aktuelleSeite()) : null;
    const nurLesen = !!(seite && seite.gesperrt);

    const machText = (ph) => {
      const ct = document.createElement('div');
      ct.className = 'ct';
      ct.contentEditable = nurLesen ? 'false' : 'true';
      ct.spellcheck = !!Store.getMeta('rechtschreib', false);
      ct.dataset.ph = ph || t.ph || '';
      ct.innerHTML = inline(block.text || '');
      if (block.color) ct.classList.add(block.color.startsWith('bg-') ? block.color : 't-' + block.color);
      return ct;
    };

    switch (block.type) {

      case 'divider':
        box.innerHTML = '<hr style="width:100%">';
        break;

      case 'todo': {
        const mk = document.createElement('div');
        mk.className = 'mk';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!block.checked;
        cb.addEventListener('change', () => {
          Store.updateBlock(block.id, { checked: cb.checked });
          el.classList.toggle('done', cb.checked);
        });
        mk.appendChild(cb);
        box.appendChild(mk);
        box.appendChild(machText());
        if (block.checked) el.classList.add('done');
        break;
      }

      case 'bullet': {
        const mk = document.createElement('div');
        mk.className = 'mk';
        mk.textContent = tiefe % 3 === 0 ? '•' : tiefe % 3 === 1 ? '◦' : '▪';
        box.appendChild(mk);
        box.appendChild(machText());
        break;
      }

      case 'number': {
        const mk = document.createElement('div');
        mk.className = 'mk';
        mk.textContent = (block.nr || 1) + '.';
        box.appendChild(mk);
        box.appendChild(machText());
        break;
      }

      case 'toggle': {
        const mk = document.createElement('div');
        mk.className = 'mk';
        mk.textContent = '▸';
        mk.addEventListener('click', () => {
          const auf = !el.classList.contains('open');
          el.classList.toggle('open', auf);
          Store.updateBlock(block.id, { open: auf });
          const kids = el.nextElementSibling;
          if (kids && kids.classList.contains('toggle-kids')) kids.style.display = auf ? '' : 'none';
        });
        box.appendChild(mk);
        box.appendChild(machText());
        if (block.open) el.classList.add('open');
        break;
      }

      case 'callout': {
        const kasten = document.createElement('div');
        kasten.className = 'box';
        if (block.color) kasten.classList.add('bg-' + block.color.replace('bg-',''));
        const emo = document.createElement('div');
        emo.className = 'emo';
        emo.textContent = block.icon || '💡';
        emo.title = 'Klicken für ein anderes Symbol';
        emo.addEventListener('click', () => {
          UI.emojiWaehlen(emo, (e) => { emo.textContent = e; Store.updateBlock(block.id, { icon: e }); });
        });
        kasten.appendChild(emo);
        kasten.appendChild(machText('Hinweis schreiben …'));
        box.appendChild(kasten);
        break;
      }

      case 'code': {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'width:100%; position:relative';
        const sprache = document.createElement('select');
        sprache.style.cssText =
          'position:absolute; top:8px; right:10px; background:var(--bg-input); ' +
          'border:1px solid var(--line); border-radius:4px; font-size:11.5px; ' +
          'padding:2px 4px; color:var(--text-dim); outline:none; z-index:2';
        ['Plain Text','JavaScript','TypeScript','JSX','Python','HTML','XML','CSS','SCSS','Less','JSON','YAML','TOML',
         'SQL','GraphQL','Bash','Shell','PowerShell','Java','C','C++','C#','Go','Rust','Swift','Kotlin','Dart',
         'PHP','Ruby','Perl','Lua','R','Julia','MATLAB','Haskell','Elixir','Erlang','Clojure','Scala','Objective-C',
         'Assembly','Docker','Makefile','Nginx','Diff','LaTeX','Markdown']
          .forEach(s => {
            const o = document.createElement('option');
            o.textContent = s;
            if ((block.lang || 'Plain Text') === s) o.selected = true;
            sprache.appendChild(o);
          });
        sprache.addEventListener('change', () => Store.updateBlock(block.id, { lang: sprache.value }));
        const ct = machText('Code …');
        ct.textContent = block.text || '';   /* im Codeblock kein Inline-HTML */

        /* Eingefärbt anzeigen, solange niemand darin schreibt. */
        const faerbe = () => {
          if (document.activeElement === ct) return;
          const t = Store.getBlock(block.id)?.text || '';
          ct.innerHTML = Zusatz.einfaerben(t, block.lang || '');
        };
        ct.addEventListener('focus', () => { ct.textContent = Store.getBlock(block.id)?.text || ''; });
        ct.addEventListener('blur', faerbe);
        sprache.addEventListener('change', () => setTimeout(faerbe, 0));
        setTimeout(faerbe, 0);
        wrap.appendChild(sprache);
        wrap.appendChild(ct);
        box.appendChild(wrap);
        break;
      }

      case 'equation':
        /* Zeigt die gesetzte Formel; ein Klick öffnet die Quelle. */
        box.appendChild(Zusatz.formelBlock(block));
        break;

      case 'image': case 'video': case 'audio': case 'file': case 'bookmark': case 'embed':
        box.appendChild(medienBlock(block));
        break;

      case 'toc':
        box.appendChild(inhaltsverzeichnis(block));
        break;

      case 'breadcrumb': {
        const d = document.createElement('div');
        d.className = 'ct';
        d.style.color = 'var(--text-dim)';
        d.style.fontSize = '14px';
        d.textContent = Store.pathOf(App.aktuelleSeite()).map(p => p.text || 'Ohne Titel').join(' / ');
        box.appendChild(d);
        break;
      }

      case 'page': {
        const a = document.createElement('div');
        a.className = 'ct';
        a.style.cssText = 'padding:4px 2px; cursor:pointer; font-weight:500; ' +
                          'display:flex; align-items:center; gap:8px';
        a.innerHTML = `<span style="font-size:18px">${block.icon || '📄'}</span>` +
                      `<span style="border-bottom:1px solid var(--line)">${esc(block.text || 'Ohne Titel')}</span>`;
        a.addEventListener('click', () => App.oeffne(block.id));
        box.appendChild(a);
        break;
      }

      case 'database':
        box.appendChild(Datenbank.render(block));
        break;

      /* Verknüpfte Ansicht: zeigt eine Datenbank, die woanders lebt.
         Eigene Filter und Sortierung, dieselben Daten — wie in Notion. */
      case 'linkeddb': {
        const w = document.createElement('div');
        w.style.width = '100%';
        if (!block.collectionId || !Store.getCollection(block.collectionId)) {
          const b2 = document.createElement('button');
          b2.className = 'sy-waehl';
          b2.textContent = '⧉ Welche Datenbank soll hier erscheinen?';
          b2.addEventListener('click', () => datenbankWaehlen(block));
          w.appendChild(b2);
        } else {
          const hinweis = document.createElement('div');
          hinweis.className = 'linked-kopf';
          const c = Store.getCollection(block.collectionId);
          hinweis.innerHTML = `⧉ Verknüpfte Ansicht von <b>${esc(c.name)}</b>` +
                              '<button data-a="andere">andere wählen</button>';
          hinweis.addEventListener('click', e => {
            if (e.target.closest('[data-a="andere"]')) datenbankWaehlen(block);
          });
          w.appendChild(hinweis);
          w.appendChild(Datenbank.render(block));
        }
        box.appendChild(w);
        break;
      }

      case 'columns': case 'columns3': {
        const w = document.createElement('div');
        const n = block.type === 'columns3' ? 3 : (block.spalten || 2);
        /* Die Spaltenzahl steht als Variable da, damit sie auf schmalen
           Bildschirmen per CSS auf eine Spalte fallen kann — wie in Notion. */
        w.className = 'spalten-block';
        w.style.setProperty('--sp', n);
        Store.childrenOf(block.id).forEach(k => w.appendChild(render(k, tiefe)));
        box.appendChild(w);
        break;
      }

      /* --- Verweis auf eine andere Seite (Notion „Link to page", Trilium-Klon) */
      case 'pageref': {
        const ziel = block.ziel ? Store.getBlock(block.ziel) : null;
        const a = document.createElement('div');
        a.className = 'ct pageref';
        if (ziel) {
          a.innerHTML = `<span style="font-size:17px">${ziel.icon || '📄'}</span>` +
                        `<span class="pr-t">${esc(ziel.text || 'Ohne Titel')}</span>` +
                        `<span class="pr-i" title="Verweis — die Seite liegt woanders">↗</span>`;
          a.addEventListener('click', () => App.oeffne(ziel.id));
        } else {
          a.innerHTML = '<span class="pr-i">↗</span><span style="color:var(--text-faint)">Seite auswählen …</span>';
          a.addEventListener('click', () => seiteWaehlen(block));
        }
        box.appendChild(a);
        break;
      }

      /* --- Synchronisierter Block: zeigt den Inhalt einer anderen Stelle --- */
      case 'synced': {
        const quelle = block.quelle ? Store.getBlock(block.quelle) : null;
        const w = document.createElement('div');
        w.className = 'synced';
        if (!quelle) {
          w.innerHTML = '<div class="sy-kopf">⇄ Synchronisierter Block</div>';
          const b = document.createElement('button');
          b.className = 'sy-waehl';
          b.textContent = 'Quelle wählen …';
          b.addEventListener('click', () => quelleWaehlen(block));
          w.appendChild(b);
        } else {
          w.innerHTML = `<div class="sy-kopf">⇄ synchron mit „${esc(quelle.text || 'Seite')}"</div>`;
          Store.childrenOf(quelle.id).forEach(k => w.appendChild(render(k, tiefe + 1)));
        }
        box.appendChild(w);
        break;
      }

      /* --- Knopf: legt Blöcke oder Datenbankzeilen an (Notions Button) ----- */
      case 'button': {
        const w = document.createElement('div');
        w.className = 'knopf-blk';
        const b = document.createElement('button');
        b.className = 'knopf';
        b.textContent = block.text || 'Neuer Knopf';
        b.addEventListener('click', () => knopfAusfuehren(block));
        const s = document.createElement('button');
        s.className = 'knopf-set';
        s.textContent = '⚙';
        s.title = 'Was soll der Knopf tun?';
        s.addEventListener('click', () => knopfEinstellen(block));
        w.append(b, s);
        box.appendChild(w);
        break;
      }

      case 'html': {
        const w = document.createElement('div');
        w.style.width = '100%';
        const ct = machText('<b>HTML</b> hier einfügen');
        ct.textContent = block.text || '';
        ct.style.cssText = 'font:13px var(--mono); background:var(--bg-card); padding:10px 12px; border-radius:6px';
        const vorschau = document.createElement('div');
        vorschau.className = 'html-vorschau';
        vorschau.innerHTML = block.text || '';
        w.append(ct, vorschau);
        box.appendChild(w);
        break;
      }

      case 'table':
        box.appendChild(Zusatz.tabelle(block));
        break;

      case 'whiteboard':
        box.appendChild(Zusatz.whiteboard(block));
        break;

      case 'chart':
        box.appendChild(Zusatz.diagramm(block));
        break;

      case 'flashcard': {
        const w = document.createElement('div');
        w.className = 'fkarte';
        const [vorn, hinten] = Werkzeuge.teileKarte(block);
        const faellig = !block.sr || !block.sr.faellig || new Date(block.sr.faellig) <= new Date();
        w.innerHTML = `<div class="fk-kopf">🎴 Karteikarte` +
          `<span class="fk-status">${faellig ? 'fällig' : 'nächste Wiederholung ' +
            new Date(block.sr.faellig).toLocaleDateString('de-DE')}</span></div>`;
        const ct = machText('Frage :: Antwort');
        w.appendChild(ct);
        const vor = document.createElement('div');
        vor.className = 'fk-vor';
        vor.innerHTML = `<b>${inline(vorn)}</b><span>${inline(hinten)}</span>`;
        w.appendChild(vor);
        box.appendChild(w);
        break;
      }

      case 'backlinks': {
        const d = document.createElement('div');
        d.style.width = '100%';
        const seite2 = Store.getBlock(App.aktuelleSeite());
        if (seite2) Links.fusszeile(seite2, d);
        if (!d.children.length) {
          d.innerHTML = '<div style="color:var(--text-faint); font-size:14px">' +
                        'Noch zeigt keine Seite hierher. Schreibe auf einer anderen Seite ' +
                        '<code>[[' + esc(seite2 ? (seite2.text || 'Titel') : 'Titel') + ']]</code>.</div>';
        }
        box.appendChild(d);
        break;
      }

      case 'h1': case 'h2': case 'h3': {
        if (block.toggleKopf) {
          const mk = document.createElement('div');
          mk.className = 'mk kopf-mk';
          mk.textContent = '▸';
          mk.addEventListener('click', () => {
            Store.updateBlock(block.id, { open: !block.open });
            App.zeichneSeite();
          });
          box.appendChild(mk);
          if (block.open) el.classList.add('open');
        }
        box.appendChild(machText());
        break;
      }

      default:
        box.appendChild(machText());
    }

    /* Kommentarmarke */
    if ((block.kommentare || []).length) {
      const k = document.createElement('button');
      k.className = 'komm-marke';
      const offen = block.kommentare.filter(x => !x.erledigt).length;
      k.textContent = '💬' + (offen || '');
      k.title = block.kommentare.map(x => x.text).join('\n');
      k.addEventListener('click', () => Kommentare.panel(App.aktuelleSeite()));
      el.appendChild(k);
    }

    /* Kindblöcke einer Toggle-Überschrift */
    if (block.toggleKopf && ['h1','h2','h3'].includes(block.type)) {
      const kids = document.createElement('div');
      kids.className = 'toggle-kids';
      kids.style.marginLeft = '24px';
      if (!block.open) kids.style.display = 'none';
      Store.childrenOf(block.id).forEach(k => kids.appendChild(render(k, tiefe + 1)));
      const huelle = document.createElement('div');
      huelle.appendChild(el);
      huelle.appendChild(kids);
      return huelle;
    }

    /* Kindblöcke — bei Toggle in einen eigenen Container */
    if (['bullet','number','todo','quote','callout'].includes(block.type) && (block.content || []).length) {
      const kids = document.createElement('div');
      kids.style.marginLeft = '24px';
      Store.childrenOf(block.id).forEach(k => kids.appendChild(render(k, tiefe + 1)));
      const huelle = document.createElement('div');
      huelle.appendChild(el);
      huelle.appendChild(kids);
      return huelle;
    }

    if (block.type === 'toggle') {
      const kids = document.createElement('div');
      kids.className = 'toggle-kids';
      kids.style.marginLeft = '24px';
      if (!block.open) kids.style.display = 'none';
      Store.childrenOf(block.id).forEach(k => kids.appendChild(render(k, tiefe + 1)));
      const huelle = document.createElement('div');
      huelle.appendChild(el);
      huelle.appendChild(kids);
      return huelle;
    }

    return el;
  };

  /* --- Medienblöcke ------------------------------------------------------- */
  const medienBlock = (block) => {
    const w = document.createElement('div');
    w.style.width = '100%';

    if (!block.src) {
      /* Noch keine Quelle: Eingabefeld anzeigen */
      const feld = document.createElement('div');
      feld.style.cssText = 'display:flex; gap:8px; padding:12px 14px; background:var(--bg-card); ' +
                           'border-radius:6px; align-items:center';
      const d = block.dienst ? dienst(block.dienst) : null;
      const info = d ? d.hinweis : { image:'Bild-URL', video:'Video-URL', audio:'Audio-URL',
                     file:'Datei-URL', bookmark:'Adresse der Webseite', embed:'Einbettungs-URL' }[block.type];
      feld.innerHTML = `<span style="font-size:16px">${d ? d.icon : typ(block.type).icon}</span>`;
      const inp = document.createElement('input');
      inp.placeholder = (d ? d.name + ': ' + info : info) + ' einfügen und Enter drücken';
      inp.style.cssText = 'flex:1; background:none; border:none; outline:none; font-size:14px';
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && inp.value.trim()) {
          const roh = inp.value.trim();
          Store.updateBlock(block.id, {
            src: block.dienst ? einbettungsAdresse(block.dienst, roh) : roh,
            quelle: roh
          });
          App.zeichneSeite();
        }
      });
      const datei = document.createElement('button');
      datei.textContent = 'Hochladen';
      datei.style.cssText = 'font-size:13px; color:var(--accent); padding:4px 8px; border-radius:5px';
      datei.addEventListener('click', () => hochladen(block));
      feld.appendChild(inp);
      feld.appendChild(datei);
      w.appendChild(feld);
      return w;
    }

    if (block.type === 'image') {
      const i = document.createElement('img');
      i.src = block.src; i.alt = block.text || '';
      w.appendChild(i);
    } else if (block.type === 'video') {
      const v = document.createElement('video');
      v.src = block.src; v.controls = true; v.style.maxWidth = '100%';
      w.appendChild(v);
    } else if (block.type === 'audio') {
      const a = document.createElement('audio');
      a.src = block.src; a.controls = true; a.style.width = '100%';
      w.appendChild(a);
    } else if (block.type === 'file') {
      const a = document.createElement('a');
      a.href = block.src; a.target = '_blank'; a.download = '';
      a.style.cssText = 'display:flex; gap:10px; padding:12px 14px; background:var(--bg-card); ' +
                        'border-radius:6px; color:var(--text); text-decoration:none; align-items:center';
      a.innerHTML = `<span>📎</span><span>${esc(block.text || block.src)}</span>`;
      w.appendChild(a);
    } else if (block.type === 'bookmark') {
      const a = document.createElement('a');
      a.href = block.src; a.target = '_blank'; a.rel = 'noopener';
      a.style.cssText = 'display:block; padding:14px 16px; border:1px solid var(--line); ' +
                        'border-radius:6px; color:var(--text); text-decoration:none';
      let host = block.src;
      try { host = new URL(block.src).hostname.replace('www.',''); } catch {}
      a.innerHTML = `<div style="font-weight:500; margin-bottom:3px">${esc(block.text || host)}</div>` +
                    `<div style="font-size:12.5px; color:var(--text-dim)">${esc(block.src)}</div>`;
      w.appendChild(a);
    } else if (block.type === 'embed') {
      const f = document.createElement('iframe');
      f.src = block.src;
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('referrerpolicy', 'no-referrer');
      w.appendChild(f);
      /* Manche Seiten verbieten den Rahmen. Dann hilft der Weg zum Original. */
      const q = block.quelle || block.src;
      const zeile = document.createElement('div');
      zeile.style.cssText = 'font-size:12px; color:var(--text-dim); padding:3px 2px';
      zeile.innerHTML = (block.dienst ? esc(dienst(block.dienst)?.name || '') + ' · ' : '') +
        `<a href="${esc(q)}" target="_blank" rel="noopener" style="color:var(--text-dim)">` +
        'Original öffnen ↗</a>';
      w.appendChild(zeile);
    }

    /* Beschriftung */
    const cap = document.createElement('div');
    cap.className = 'ct';
    cap.contentEditable = 'true';
    cap.dataset.ph = 'Beschriftung hinzufügen';
    cap.style.cssText = 'font-size:13px; color:var(--text-dim); padding:5px 2px';
    cap.textContent = block.caption || '';
    cap.addEventListener('input', () => Store.updateBlock(block.id, { caption: cap.textContent }));
    w.appendChild(cap);
    return w;
  };

  /** Datei einlesen und als Data-URL speichern — bleibt damit lokal. */
  const hochladen = (block) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = { image:'image/*', video:'video/*', audio:'audio/*' }[block.type] || '*/*';
    inp.addEventListener('change', () => {
      const f = inp.files[0];
      if (!f) return;
      if (f.size > 12 * 1024 * 1024) {
        UI.toast('Die Datei ist größer als 12 MB. Das würde den lokalen Speicher sprengen.');
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        Store.updateBlock(block.id, { src: r.result, text: f.name });
        App.zeichneSeite();
        UI.toast('Datei lokal gespeichert');
      };
      r.readAsDataURL(f);
    });
    inp.click();
  };

  /* --- Inhaltsverzeichnis ------------------------------------------------- */
  const inhaltsverzeichnis = (block) => {
    const d = document.createElement('div');
    d.className = 'ct';
    const seite = Store.getBlock(block.parentId);
    const kinder = seite ? Store.childrenOf(seite.id) : [];
    const stufen = { h1: 'lvl1', h2: 'lvl2', h3: 'lvl3' };
    let leer = true;
    kinder.forEach(k => {
      if (!stufen[k.type]) return;
      leer = false;
      const a = document.createElement('a');
      a.className = stufen[k.type];
      a.textContent = k.text || 'Ohne Titel';
      a.addEventListener('click', () => {
        const ziel = document.querySelector(`[data-bid="${k.id}"]`);
        if (ziel) ziel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      d.appendChild(a);
    });
    if (leer) {
      d.innerHTML = '<span style="color:var(--text-faint); font-size:14px">' +
                    'Noch keine Überschriften auf dieser Seite</span>';
    }
    return d;
  };

  /* ========================================================================
   * TASTATUR
   * ------------------------------------------------------------------------
   * Hier steckt das Verhalten, das den Editor ausmacht.
   * ======================================================================*/

  const bindeEditor = (wurzel) => {

    /* --- Tippen: Text sichern und Markdown-Kürzel prüfen ----------------- */
    wurzel.addEventListener('input', (e) => {
      const ct = e.target.closest('.ct');
      if (!ct) return;
      const blk = ct.closest('.blk');
      if (!blk) return;
      const b = Store.getBlock(blk.dataset.bid);
      if (!b) return;

      const roh = ct.textContent;

      /* Markdown-Kürzel: nur am Zeilenanfang, nur einmal */
      if (b.type === 'text' && /\s$/.test(roh)) {
        const wort = roh.trim();
        const treffer = TYPEN.find(t => {
          if (!t.md) return false;
          const liste = Array.isArray(t.md) ? t.md : [t.md];
          return liste.includes(wort);
        });
        if (treffer) {
          ct.textContent = '';
          umwandeln(b.id, treffer.id);
          return;
        }
      }

      Store.updateBlock(b.id, { text: roh });
      if (b.type === 'toc') return;
    });

    /* --- Tasten ---------------------------------------------------------- */
    wurzel.addEventListener('keydown', (e) => {
      const ct = e.target.closest('.ct');
      if (!ct) return;
      const blk = ct.closest('.blk');
      if (!blk) return;
      const b = Store.getBlock(blk.dataset.bid);
      if (!b) return;

      /* Slash-Menü öffnen */
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        setTimeout(() => slashMenue(ct, b), 0);
        return;
      }

      /* Enter — Strg + Enter hat eine eigene Bedeutung, siehe weiter unten */
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        /* Im Codeblock erzeugt Enter einen Zeilenumbruch */
        if (b.type === 'code') return;

        e.preventDefault();

        /* Leerer Listenpunkt: zurück zu normalem Text */
        if (['bullet','number','todo','toggle','quote'].includes(b.type) && !ct.textContent.trim()) {
          umwandeln(b.id, 'text');
          return;
        }

        /* Neuen Block gleichen Typs darunter */
        const folge = ['bullet','number','todo'].includes(b.type) ? b.type : 'text';
        const eltern = Store.getBlock(b.parentId);
        const idx = eltern ? eltern.content.indexOf(b.id) + 1 : -1;
        const neu = Store.addBlock(b.parentId, folge, {}, idx);
        App.zeichneSeite(neu.id);
        return;
      }

      /* Backspace am Anfang */
      if (e.key === 'Backspace' && amAnfang(ct)) {
        if (b.type !== 'text') {
          /* Erst den Typ zurücksetzen, wie in Notion */
          e.preventDefault();
          umwandeln(b.id, 'text');
          return;
        }
        /* Leerer Textblock: löschen und zum vorherigen springen */
        if (!ct.textContent) {
          e.preventDefault();
          const eltern = Store.getBlock(b.parentId);
          if (!eltern) return;
          const idx = eltern.content.indexOf(b.id);
          if (idx <= 0) return;
          const vorher = Store.getBlock(eltern.content[idx - 1]);
          Store.trashBlock(b.id);
          Store.purgeBlock(b.id);
          App.zeichneSeite(vorher ? vorher.id : null, 'ende');
          return;
        }
      }

      /* Tab: einrücken */
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) ausruecken(b);
        else einruecken(b);
        return;
      }

      /* Pfeil hoch/runter zwischen Blöcken */
      if (e.key === 'ArrowUp' && amAnfang(ct)) {
        const alle = [...wurzel.querySelectorAll('.ct')];
        const i = alle.indexOf(ct);
        if (i > 0) { e.preventDefault(); cursorAnsEnde(alle[i - 1]); }
        return;
      }
      if (e.key === 'ArrowDown' && amEnde(ct)) {
        const alle = [...wurzel.querySelectorAll('.ct')];
        const i = alle.indexOf(ct);
        if (i >= 0 && i < alle.length - 1) { e.preventDefault(); alle[i + 1].focus(); }
        return;
      }

      /* Strg+Shift+Pfeil: Block verschieben */
      if (e.ctrlKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        verschiebe(b, e.key === 'ArrowUp' ? -1 : 1);
        return;
      }

      /* Strg+Alt+Ziffer: Blocktyp wechseln */
      if ((e.ctrlKey || e.metaKey) && e.altKey && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const ziel = { '0':'text','1':'h1','2':'h2','3':'h3','4':'todo','5':'bullet',
                       '6':'number','7':'toggle','8':'code','9':'page' }[e.key];
        if (ziel === 'page') {
          const p = Store.addPage(App.aktuelleSeite(), { text: ct.textContent });
          Store.trashBlock(b.id);
          App.zeichneSeite();
          App.oeffne(p.id);
        } else if (ziel) umwandeln(b.id, ziel);
        return;
      }

      /* Strg + Enter: abhaken, auf- und zuklappen, Seite öffnen */
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (b.type === 'todo') { Store.updateBlock(b.id, { checked: !b.checked }); App.zeichneSeite(b.id, 'ende'); }
        else if (b.type === 'toggle' || b.toggleKopf) { Store.updateBlock(b.id, { open: !b.open }); App.zeichneSeite(b.id, 'ende'); }
        else if (b.type === 'page') App.oeffne(b.id);
        else if (b.type === 'pageref' && b.ziel) App.oeffne(b.ziel);
        return;
      }

      /* Strg + Shift + M: Kommentar am Block */
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        Kommentare.neu(b, getSelection().toString());
        return;
      }

      /* Inline-Formatierung */
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'b') { e.preventDefault(); umschliesse('**'); return; }
        if (k === 'i') { e.preventDefault(); umschliesse('*');  return; }
        if (k === 'u') { e.preventDefault(); umschliesse('__'); return; }
        if (k === 'e') { e.preventDefault(); umschliesse('`');  return; }
        if (e.shiftKey && k === 's') { e.preventDefault(); umschliesse('~~'); return; }
        if (k === 'd') { e.preventDefault(); dupliziere(b); return; }
      }
    });

    /* --- Klick auf die Griffe -------------------------------------------- */
    wurzel.addEventListener('click', (e) => {
      const btn = e.target.closest('.handles button');
      if (!btn) return;
      const blk = btn.closest('.blk');
      const b = Store.getBlock(blk.dataset.bid);
      if (!b) return;

      if (btn.dataset.act === 'add') {
        const eltern = Store.getBlock(b.parentId);
        const idx = eltern ? eltern.content.indexOf(b.id) + 1 : -1;
        const neu = Store.addBlock(b.parentId, 'text', {}, idx);
        App.zeichneSeite(neu.id);
      } else {
        blockMenue(btn, b);
      }
    });

    /* --- Ziehen und Ablegen ---------------------------------------------- */
    let gezogen = null;
    wurzel.addEventListener('mousedown', (e) => {
      const griff = e.target.closest('.handles button[data-act="menu"]');
      if (!griff) return;
      const blk = griff.closest('.blk');
      blk.draggable = true;
      gezogen = blk.dataset.bid;
    });
    wurzel.addEventListener('dragstart', (e) => {
      const blk = e.target.closest('.blk');
      if (blk) { gezogen = blk.dataset.bid; blk.style.opacity = '.4'; }
    });
    wurzel.addEventListener('dragend', (e) => {
      const blk = e.target.closest('.blk');
      if (blk) { blk.style.opacity = ''; blk.draggable = false; }
    });
    /* Die Hilfslinie zeigt, wo der Block landet: oberhalb oder unterhalb. */
    let untenAblegen = false;
    wurzel.addEventListener('dragover', (e) => {
      e.preventDefault();
      const blk = e.target.closest('.blk');
      wurzel.querySelectorAll('.blk').forEach(x => {
        x.style.borderTop = ''; x.style.borderBottom = '';
      });
      if (!blk || blk.dataset.bid === gezogen) return;
      const r = blk.getBoundingClientRect();
      untenAblegen = (e.clientY - r.top) > r.height / 2;
      if (untenAblegen) blk.style.borderBottom = '2px solid var(--accent)';
      else blk.style.borderTop = '2px solid var(--accent)';
    });
    wurzel.addEventListener('drop', (e) => {
      e.preventDefault();
      wurzel.querySelectorAll('.blk').forEach(x => {
        x.style.borderTop = ''; x.style.borderBottom = '';
      });
      const ziel = e.target.closest('.blk');
      if (!ziel || !gezogen || ziel.dataset.bid === gezogen) return;

      /* Mit gedrückter Alt-Taste wird kopiert statt verschoben — wie in Notion. */
      if (e.altKey) {
        const z = Store.getBlock(ziel.dataset.bid);
        const daten = Store.baum(gezogen);
        const eltern = Store.getBlock(z.parentId);
        const idx = eltern ? eltern.content.indexOf(z.id) : -1;
        Store.baumEinfuegen(daten, z.parentId, idx);
        App.zeichneSeite();
        UI.toast('Block kopiert');
        gezogen = null;
        return;
      }

      lege(gezogen, ziel.dataset.bid, untenAblegen);
      gezogen = null;
    });
  };

  /* --- Textauszeichnung um die Auswahl legen ------------------------------ */
  const umschliesse = (marke) => {
    const s = getSelection();
    if (!s.rangeCount) return;
    const txt = s.toString();
    if (!txt) return;
    const r = s.getRangeAt(0);
    r.deleteContents();
    r.insertNode(document.createTextNode(marke + txt + marke));
    /* Änderung sichern */
    const ct = r.startContainer.parentElement?.closest('.ct');
    if (ct) {
      const blk = ct.closest('.blk');
      Store.updateBlock(blk.dataset.bid, { text: ct.textContent });
      App.zeichneSeite(blk.dataset.bid, 'ende');
    }
  };

  /* ========================================================================
   * BLOCK-OPERATIONEN
   * ======================================================================*/

  const umwandeln = (id, neuerTyp) => {
    const b = Store.getBlock(id);
    if (!b) return;

    /* Datenbank-Blöcke sind eigene Sache */
    if (neuerTyp.startsWith('db-')) {
      const layout = neuerTyp.slice(3);
      const eltern = Store.getBlock(b.parentId);
      const idx = eltern ? eltern.content.indexOf(b.id) : -1;
      Store.trashBlock(b.id);
      Store.purgeBlock(b.id);
      const { block } = Store.addDatabase(b.parentId, 'Neue Datenbank', null, layout);
      if (eltern && idx >= 0) {
        eltern.content = eltern.content.filter(x => x !== block.id);
        eltern.content.splice(idx, 0, block.id);
        Store.updateBlock(eltern.id, { content: eltern.content });
      }
      App.zeichneSeite();
      return;
    }

    /* Einbettungen sind alle derselbe Block, nur mit gemerktem Dienst */
    if (neuerTyp.startsWith('embed-')) {
      Store.updateBlock(id, { type: 'embed', dienst: neuerTyp.slice(6), text: '', src: null });
      App.zeichneSeite();
      return;
    }

    /* KI-Blöcke lösen eine Aktion aus, statt einen Typ zu setzen */
    if (neuerTyp.startsWith('ai-')) {
      KI.blockAktion(neuerTyp, b);
      return;
    }

    if (neuerTyp === 'page') {
      const p = Store.addPage(App.aktuelleSeite(), { text: b.text || '' });
      Store.trashBlock(b.id);
      App.zeichneSeite();
      App.oeffne(p.id);
      return;
    }

    /* Toggle-Überschrift: normale Überschrift mit Klapp-Merkmal */
    if (neuerTyp.startsWith('toggle-h')) {
      Store.updateBlock(id, { type: neuerTyp.slice(7), toggleKopf: true, open: true });
      App.zeichneSeite(id, 'ende');
      return;
    }

    /* Spalten brauchen Kinder, sonst bleiben sie leer */
    if (neuerTyp === 'columns' || neuerTyp === 'columns3') {
      Store.updateBlock(id, { type: neuerTyp, text: '' });
      const n = neuerTyp === 'columns3' ? 3 : 2;
      for (let i = Store.childrenOf(id).length; i < n; i++) Store.addBlock(id, 'text');
      App.zeichneSeite();
      return;
    }

    Store.updateBlock(id, { type: neuerTyp });

    /* Zwei Typen fragen direkt nach ihrem Ziel */
    if (neuerTyp === 'pageref') { App.zeichneSeite(); seiteWaehlen(Store.getBlock(id)); return; }
    if (neuerTyp === 'synced')  { App.zeichneSeite(); quelleWaehlen(Store.getBlock(id)); return; }
    if (neuerTyp === 'linkeddb'){ App.zeichneSeite(); datenbankWaehlen(Store.getBlock(id)); return; }
    if (neuerTyp === 'button')  { App.zeichneSeite(); knopfEinstellen(Store.getBlock(id)); return; }

    App.zeichneSeite(id, 'ende');
  };

  const einruecken = (b) => {
    const eltern = Store.getBlock(b.parentId);
    if (!eltern) return;
    const idx = eltern.content.indexOf(b.id);
    if (idx <= 0) return;
    const neuerElter = Store.getBlock(eltern.content[idx - 1]);
    if (!neuerElter) return;
    eltern.content.splice(idx, 1);
    neuerElter.content = neuerElter.content || [];
    neuerElter.content.push(b.id);
    Store.updateBlock(eltern.id, { content: eltern.content });
    Store.updateBlock(neuerElter.id, { content: neuerElter.content });
    Store.updateBlock(b.id, { parentId: neuerElter.id });
    App.zeichneSeite(b.id, 'ende');
  };

  const ausruecken = (b) => {
    const eltern = Store.getBlock(b.parentId);
    if (!eltern || !eltern.parentId) return;
    const gross = Store.getBlock(eltern.parentId);
    if (!gross) return;
    eltern.content = eltern.content.filter(x => x !== b.id);
    const idx = gross.content.indexOf(eltern.id) + 1;
    gross.content.splice(idx, 0, b.id);
    Store.updateBlock(eltern.id, { content: eltern.content });
    Store.updateBlock(gross.id, { content: gross.content });
    Store.updateBlock(b.id, { parentId: gross.id });
    App.zeichneSeite(b.id, 'ende');
  };

  const verschiebe = (b, richtung) => {
    const eltern = Store.getBlock(b.parentId);
    if (!eltern) return;
    const i = eltern.content.indexOf(b.id);
    const j = i + richtung;
    if (j < 0 || j >= eltern.content.length) return;
    [eltern.content[i], eltern.content[j]] = [eltern.content[j], eltern.content[i]];
    Store.updateBlock(eltern.id, { content: eltern.content });
    App.zeichneSeite(b.id, 'ende');
  };

  const lege = (quelleId, zielId, danach = false) => {
    const q = Store.getBlock(quelleId), z = Store.getBlock(zielId);
    if (!q || !z) return;
    const qe = Store.getBlock(q.parentId), ze = Store.getBlock(z.parentId);
    if (!qe || !ze) return;
    qe.content = qe.content.filter(x => x !== quelleId);
    Store.updateBlock(qe.id, { content: qe.content });
    const zi = ze.content.indexOf(zielId) + (danach ? 1 : 0);
    ze.content.splice(zi, 0, quelleId);
    Store.updateBlock(ze.id, { content: ze.content });
    Store.updateBlock(quelleId, { parentId: ze.id });
    App.zeichneSeite();
  };

  const dupliziere = (b) => {
    const eltern = Store.getBlock(b.parentId);
    const idx = eltern ? eltern.content.indexOf(b.id) + 1 : -1;
    const daten = Store.baum(b.id);
    const neu = Store.baumEinfuegen(daten, b.parentId, idx);
    App.zeichneSeite(neu ? neu.id : null);
  };

  /** Fügt einen Block dieses Typs am Ende der offenen Seite ein. */
  const einfuegenAmEnde = (typId) => {
    const seite = App.aktuelleSeite();
    if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
    const b = Store.addBlock(seite, 'text');
    umwandeln(b.id, typId);
  };

  /** Das „Umwandeln in"-Menü, auch aus der Auswahlleiste heraus. */
  const umwandelnMenue = (rect, b) => {
    const m = UI.menu('<div class="grp">Umwandeln in</div>' +
      UMWANDELBAR.map(id => {
        const t = typ(id);
        return `<button data-t="${id}"><span class="mi">${t.icon}</span>${t.name}` +
               (t.kurz ? `<span class="ms">${t.kurz}</span>` : '') + '</button>';
      }).join(''), rect.left, rect.bottom + 6);
    m.addEventListener('click', ev => {
      const t = ev.target.closest('button[data-t]');
      if (t) { m.remove(); umwandeln(b.id, t.dataset.t); }
    });
  };

  /* --- Auswahlhilfen für Verweis- und Sync-Blöcke ------------------------- */
  const seitenPicker = (titel, beiWahl) => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder"><input id="sq" placeholder="' + titel + '" autocomplete="off">' +
      '<div class="res" id="sr"></div><div class="hint">Esc bricht ab</div></div>';
    document.body.appendChild(o);
    const inp = o.querySelector('#sq'), res = o.querySelector('#sr');
    const zeichne = (q = '') => {
      res.innerHTML = Links.seiten()
        .filter(p => !q || (p.text || '').toLowerCase().includes(q.toLowerCase()))
        .slice(0, 30)
        .map(p => `<button data-id="${p.id}"><span>${p.icon || '📄'}</span>` +
                  `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span></button>`).join('');
    };
    zeichne();
    inp.addEventListener('input', () => zeichne(inp.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') o.remove(); });
    res.addEventListener('click', e => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      o.remove();
      beiWahl(b.dataset.id);
    });
    inp.focus();
  };

  /** Welche vorhandene Datenbank soll die verknüpfte Ansicht zeigen? */
  const datenbankWaehlen = (block) => {
    const alle = Object.values(Store.cache.collections);
    if (!alle.length) { UI.toast('Es gibt noch keine Datenbank'); return; }
    const m = UI.menu('<div class="grp">Verknüpfte Ansicht von …</div>' +
      alle.map(c => `<button data-c="${c.id}"><span class="mi">${esc(c.icon || '🗂')}</span>` +
                    `${esc(c.name)}<span class="ms">${Store.rowsOf(c.id).length}</span></button>`).join(''),
      innerWidth / 2 - 140, 150);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-c]');
      if (!b) return;
      m.remove();
      /* Eine eigene Ansicht anlegen, damit Filter hier unabhängig bleiben */
      const v = Store.addView(b.dataset.c, 'table', 'Verknüpft');
      Store.updateBlock(block.id, { collectionId: b.dataset.c, aktiveView: v.id, verknuepft: true });
      App.zeichneSeite();
    });
  };

  const seiteWaehlen = (block) =>
    seitenPicker('Auf welche Seite soll der Verweis zeigen?', (id) => {
      Store.updateBlock(block.id, { ziel: id });
      App.zeichneSeite();
    });

  const quelleWaehlen = (block) =>
    seitenPicker('Welche Seite soll gespiegelt werden?', (id) => {
      Store.updateBlock(block.id, { quelle: id });
      App.zeichneSeite();
    });

  /* --- Knopf-Block (Notions Button) -------------------------------------- */
  const AKTIONS_NAMEN = {
    block: 'Block einfügen', zeile: 'Datenbankeintrag anlegen',
    seite: 'Unterseite anlegen', meldung: 'Meldung zeigen', timer: 'Timer',
    aendern: 'Einträge ändern', oeffnen: 'Seite öffnen'
  };
  const knopfAusfuehren = async (block) => {
    /* Mehrere Aktionen laufen der Reihe nach — Notions Button kann das auch. */
    const liste = block.aktionen && block.aktionen.length
      ? block.aktionen
      : (block.aktion ? [block.aktion] : []);

    if (!liste.length) { knopfEinstellen(block); return; }

    if (block.bestaetigen &&
        !confirm((block.text || 'Knopf') + ' ausführen?\n\n' +
                 liste.length + (liste.length === 1 ? ' Aktion' : ' Aktionen'))) return;

    for (const a of liste) eineAktion(block, a);
    App.zeichneSeite();
    UI.toast(liste.length === 1 ? 'Ausgeführt' : liste.length + ' Aktionen ausgeführt');
  };

  const eineAktion = (block, a) => {
    const datum = (v) => {
      if (v === 'heute')  return new Date().toISOString().slice(0, 10);
      if (v === 'morgen') { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().slice(0, 10); }
      if (v === 'jetzt')  return new Date().toISOString().slice(0, 16);
      const m = String(v || '').match(/^heute\s*\+\s*(\d+)$/);
      if (m) { const t = new Date(); t.setDate(t.getDate() + (+m[1])); return t.toISOString().slice(0, 10); }
      return v;
    };

    if (a.art === 'block') {
      const eltern = Store.getBlock(block.parentId);
      const idx = eltern ? eltern.content.indexOf(block.id) + 1 : -1;
      Store.addBlock(block.parentId, a.blockTyp || 'todo', { text: a.blockText || '' }, idx);
      return;
    }
    if (a.art === 'zeile') {
      const dbs = Object.values(Store.cache.collections);
      const c = a.collectionId ? Store.getCollection(a.collectionId) : dbs[0];
      if (!c) { UI.toast('Keine Datenbank gefunden'); return; }
      const titelKey = Object.keys(c.schema).find(k => c.schema[k].type === 'title') || 'title';
      const props = {};
      /* Vorbelegte Felder aus der Einstellung übernehmen */
      Object.entries(a.felder || {}).forEach(([k, v]) => { props[k] = datum(v); });
      const r = Store.addRow(c.id, Object.assign(props, { [titelKey]: datum(a.zeilenText) || 'Neuer Eintrag' }));
      Store.updateBlock(r.id, { text: datum(a.zeilenText) || 'Neuer Eintrag' });
      return;
    }
    if (a.art === 'seite') {
      const p = Store.addPage(App.aktuelleSeite(), { text: a.seitenTitel || 'Neue Seite' });
      App.zeichneBaum();
      return;
    }
    if (a.art === 'meldung') { UI.toast(a.text || 'Fertig'); return; }

    /* Notions „Edit pages in": alle Einträge, die zum Filter passen, ändern. */
    if (a.art === 'aendern') {
      const n = Datenbank.fremdSetzen({
        ziel: a.collectionId, zielKey: a.zielKey, wert: datum(a.wert),
        filterKey: a.filterKey, filterOp: a.filterOp, filterWert: a.filterWert
      }, null, null);
      UI.toast(n + (n === 1 ? ' Eintrag geändert' : ' Einträge geändert'));
      return;
    }

    /* Zu einer Seite springen — Notions „Open page". */
    if (a.art === 'oeffnen') {
      if (a.seiteId && Store.getBlock(a.seiteId)) App.oeffne(a.seiteId);
      else UI.toast('Die Seite gibt es nicht mehr');
      return;
    }

    /* Timer: erster Klick setzt den Start, der zweite das Ende. */
    if (a.art === 'timer') {
      const jetzt = new Date().toISOString().slice(0, 16);
      if (!block.timerStart) {
        Store.updateBlock(block.id, { timerStart: jetzt });
        UI.toast('Timer gestartet um ' + jetzt.slice(11));
      } else {
        const min = Math.round((new Date(jetzt) - new Date(block.timerStart)) / 60000);
        Store.addBlock(block.parentId, 'text',
          { text: `⏱ ${a.text || 'Zeit'}: ${min} Minuten (${block.timerStart.slice(11)} bis ${jetzt.slice(11)})` });
        Store.updateBlock(block.id, { timerStart: null });
        UI.toast(min + ' Minuten festgehalten');
      }
      return;
    }
  };

  const knopfEinstellen = (block) => {
    const a = (block.aktionen && block.aktionen[0]) || block.aktion ||
              { art: 'block', blockTyp: 'todo', blockText: '' };
    const gesammelt = (block.aktionen || (block.aktion ? [block.aktion] : [])).slice();
    const dbs = Object.values(Store.cache.collections);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(520px,94vw)">' +
        '<div class="fh">Knopf einrichten</div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px; font-size:14px">' +
          `<label>Beschriftung<br><input id="kt" value="${esc(block.text || 'Neuer Knopf')}"></label>` +
          '<label>Was passiert beim Klick?<br><select id="ka">' +
            `<option value="block"${a.art === 'block' ? ' selected' : ''}>Block einfügen</option>` +
            `<option value="zeile"${a.art === 'zeile' ? ' selected' : ''}>Datenbankeintrag anlegen</option>` +
            `<option value="seite"${a.art === 'seite' ? ' selected' : ''}>Neue Unterseite anlegen</option>` +
            `<option value="meldung"${a.art === 'meldung' ? ' selected' : ''}>Kurze Meldung zeigen</option>` +
            `<option value="timer"${a.art === 'timer' ? ' selected' : ''}>Timer starten und stoppen</option>` +
            `<option value="aendern"${a.art === 'aendern' ? ' selected' : ''}>Einträge einer Datenbank ändern</option>` +
            `<option value="oeffnen"${a.art === 'oeffnen' ? ' selected' : ''}>Eine Seite öffnen</option>` +
          '</select></label>' +
          '<div id="kdet"></div>' +
          '<label style="display:flex; gap:10px; align-items:center; margin-top:4px">' +
            `<input type="checkbox" id="kb2"${block.bestaetigen ? ' checked' : ''} style="width:auto">` +
            '<span>Vor dem Ausführen nachfragen</span></label>' +
          '<div id="kliste" class="knopf-liste"></div>' +
        '</div>' +
        '<div class="fbtns">' +
          '<button data-a="mehr">＋ Weitere Aktion</button>' +
          '<button data-a="ok" class="prim">Speichern</button>' +
          '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const det = o.querySelector('#kdet');
    const zeichneDetail = () => {
      const art = o.querySelector('#ka').value;
      if (art === 'block') {
        det.innerHTML = '<label>Blocktyp<br><select id="kb">' +
          UMWANDELBAR.map(t => `<option value="${t}"${a.blockTyp === t ? ' selected' : ''}>${typ(t).name}</option>`).join('') +
          '</select></label><label style="display:block;margin-top:10px">Text<br>' +
          `<input id="kx" value="${esc(a.blockText || '')}"></label>`;
      } else if (art === 'zeile') {
        det.innerHTML = '<label>Datenbank<br><select id="kc">' +
          dbs.map(c => `<option value="${c.id}"${a.collectionId === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('') +
          '</select></label><label style="display:block;margin-top:10px">Titel des Eintrags<br>' +
          `<input id="kx" value="${esc(a.zeilenText || '')}"></label>`;
      } else if (art === 'meldung' || art === 'timer') {
        det.innerHTML = `<label>${art === 'timer' ? 'Bezeichnung der Zeit' : 'Text der Meldung'}` +
                        `<br><input id="kx" value="${esc(a.text || '')}"></label>`;
      } else if (art === 'aendern') {
        det.innerHTML =
          '<label>Datenbank<br><select id="kc">' +
            dbs.map(c => `<option value="${c.id}"${a.collectionId === c.id ? ' selected' : ''}>` +
                         `${esc(c.name || 'Ohne Namen')}</option>`).join('') +
          '</select></label>' +
          '<label style="display:block;margin-top:10px">Diese Eigenschaft setzen<br>' +
            '<select id="kzk"></select></label>' +
          '<label style="display:block;margin-top:10px">… auf diesen Wert<br>' +
            `<input id="kx" value="${esc(a.wert || '')}" placeholder="Wert · heute · morgen · {leer}"></label>` +
          '<label style="display:block;margin-top:10px">Nur bei Einträgen, wo …<br>' +
            '<select id="kfk"><option value="">alle Einträge</option></select>' +
            `<input id="kfv" value="${esc(a.filterWert || '')}" placeholder="Wert" style="margin-top:5px"></label>`;
        const felder = () => {
          const c = Store.getCollection(det.querySelector('#kc').value);
          const ks = c ? Object.keys(c.schema) : [];
          det.querySelector('#kzk').innerHTML = ks.map(k =>
            `<option value="${k}"${a.zielKey === k ? ' selected' : ''}>${esc(c.schema[k].name)}</option>`).join('');
          det.querySelector('#kfk').innerHTML = '<option value="">alle Einträge</option>' + ks.map(k =>
            `<option value="${k}"${a.filterKey === k ? ' selected' : ''}>${esc(c.schema[k].name)} …</option>`).join('');
        };
        if (dbs.length) felder();
        det.querySelector('#kc')?.addEventListener('change', felder);
      } else if (art === 'oeffnen') {
        const seiten = Object.values(Store.cache.blocks)
          .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
          .sort((x, y) => (x.text || '').localeCompare(y.text || ''));
        det.innerHTML = '<label>Welche Seite<br><select id="kseite">' +
          seiten.slice(0, 400).map(p =>
            `<option value="${p.id}"${a.seiteId === p.id ? ' selected' : ''}>` +
            `${esc(p.text || 'Ohne Titel')}</option>`).join('') +
          '</select></label>';
      } else {
        det.innerHTML = `<label>Titel der Seite<br><input id="kx" value="${esc(a.seitenTitel || '')}"></label>`;
      }
    };
    zeichneDetail();
    o.querySelector('#ka').addEventListener('change', zeichneDetail);

    const listeZeigen = () => {
      o.querySelector('#kliste').innerHTML = gesammelt.length
        ? '<div class="grp">Diese Aktionen laufen nacheinander</div>' +
          gesammelt.map((x, i) =>
            `<div class="ka-zeile"><span>${i + 1}.</span>` +
            `<b>${esc((AKTIONS_NAMEN[x.art] || x.art))}</b>` +
            `<span class="ez-grau">${esc(x.blockText || x.zeilenText || x.seitenTitel || x.text || '')}</span>` +
            `<button data-kweg="${i}">✕</button></div>`).join('')
        : '';
    };
    listeZeigen();

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }

      const weg = e.target.closest('[data-kweg]');
      if (weg) { gesammelt.splice(+weg.dataset.kweg, 1); listeZeigen(); return; }

      const mehr = e.target.closest('[data-a="mehr"]');
      const ok = e.target.closest('[data-a="ok"]');
      if (!mehr && !ok) return;

      const art = o.querySelector('#ka').value;
      const x = o.querySelector('#kx')?.value || '';
      const neu = { art };
      if (art === 'block') { neu.blockTyp = o.querySelector('#kb').value; neu.blockText = x; }
      if (art === 'zeile') { neu.collectionId = o.querySelector('#kc')?.value; neu.zeilenText = x; }
      if (art === 'seite') neu.seitenTitel = x;
      if (art === 'meldung' || art === 'timer') neu.text = x;
      if (art === 'aendern') {
        neu.collectionId = o.querySelector('#kc')?.value;
        neu.zielKey      = o.querySelector('#kzk')?.value;
        neu.wert         = x;
        neu.filterKey    = o.querySelector('#kfk')?.value || null;
        neu.filterWert   = o.querySelector('#kfv')?.value || '';
        const c2 = Store.getCollection(neu.collectionId);
        if (neu.filterKey && c2) {
          const t2 = c2.schema[neu.filterKey].type;
          neu.filterOp = (Datenbank.OPERATOREN[t2] || Datenbank.OPERATOREN.text)[0];
        }
      }
      if (art === 'oeffnen') neu.seiteId = o.querySelector('#kseite')?.value;

      if (mehr) {
        gesammelt.push(neu);
        listeZeigen();
        if (o.querySelector('#kx')) o.querySelector('#kx').value = '';
        return;
      }

      const alle = gesammelt.length ? [...gesammelt, neu] : [neu];
      Store.updateBlock(block.id, {
        text: o.querySelector('#kt').value,
        aktionen: alle,
        aktion: null,
        bestaetigen: o.querySelector('#kb2').checked
      });
      o.remove();
      App.zeichneSeite();
    });
  };

  /* ========================================================================
   * SLASH-MENÜ
   * ======================================================================*/
  const slashMenue = (ct, block) => {
    const rect = ct.getBoundingClientRect();

    /* Der Filter kommt aus dem tatsächlichen Text — nicht aus mitgezählten
       Tastendrücken. Sonst gehen schnell getippte Zeichen verloren. */
    const filterLesen = () => {
      /* Nur bis zum Schreibzeiger lesen. Wer mitten in einer Zeile / tippt,
         soll nicht den Rest des Satzes als Suchwort bekommen. */
      let bis = ct.textContent || '';
      const sel = window.getSelection();
      if (sel && sel.rangeCount && ct.contains(sel.anchorNode)) {
        const r = sel.getRangeAt(0).cloneRange();
        r.selectNodeContents(ct);
        r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
        bis = r.toString();
      }
      const m = bis.match(/\/([^\/]*)$/);
      return m ? m[1] : '';
    };
    let filter = filterLesen();

    const bauen = () => {
      const q = filter.toLowerCase().replace(/^\//, '');
      const treffer = TYPEN.filter(t =>
        !q || t.name.toLowerCase().includes(q) || t.cmd.some(c => c.startsWith(q))
      );

      const gruppen = {};
      treffer.forEach(t => (gruppen[t.gruppe] = gruppen[t.gruppe] || []).push(t));

      let html = '';
      if (!treffer.length) {
        html = '<div class="grp">Kein Treffer für „' + esc(q) + '"</div>';
      } else {
        Object.entries(gruppen).forEach(([g, liste]) => {
          html += `<div class="grp">${g}</div>`;
          liste.forEach(t => {
            html += `<button data-t="${t.id}">` +
                      `<span class="mi">${t.icon}</span>` +
                      `<span>${t.name}</span>` +
                      (t.kurz ? `<span class="ms">${t.kurz}</span>` : '') +
                    `</button>`;
          });
        });
      }
      return html;
    };

    const menu = UI.menu(bauen(), rect.left, rect.bottom + 4);

    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-t]');
      if (b) { schliessen(); umwandelnNachSlash(ct, block, b.dataset.t); }
    });

    const schliessen = () => {
      menu.remove();
      document.removeEventListener('keydown', tasten, true);
      ct.removeEventListener('input', beiEingabe);
    };

    /* Nach jedem Tastendruck den Filter aus dem Text neu lesen */
    const beiEingabe = () => {
      const vorher = filter;
      filter = filterLesen();
      /* Slash gelöscht? Dann ist das Menü fertig. */
      if (!/\/[^\/]*$/.test(ct.textContent || '')) { schliessen(); return; }
      if (filter === vorher) return;
      menu.innerHTML = bauen();
      const erste = menu.querySelector('button[data-t]');
      if (erste) erste.classList.add('on');
    };
    ct.addEventListener('input', beiEingabe);

    /* Pfeile wählen aus, Enter übernimmt */
    const tasten = (e) => {
      if (!document.body.contains(menu)) { schliessen(); return; }

      const btns = [...menu.querySelectorAll('button[data-t]')];
      const aktiv = menu.querySelector('button.on');
      const i = btns.indexOf(aktiv);

      if (e.key === 'Escape') { e.stopPropagation(); schliessen(); return; }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (aktiv) aktiv.classList.remove('on');
        const j = e.key === 'ArrowDown'
          ? (i + 1) % btns.length
          : (i - 1 + btns.length) % btns.length;
        if (btns[j]) { btns[j].classList.add('on'); btns[j].scrollIntoView({ block: 'nearest' }); }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const ziel = aktiv || btns[0];
        if (ziel) { schliessen(); umwandelnNachSlash(ct, block, ziel.dataset.t); }
        return;
      }
      if (e.key === 'Backspace' && !filter) { schliessen(); return; }
    };

    const erste = menu.querySelector('button[data-t]');
    if (erste) erste.classList.add('on');
    document.addEventListener('keydown', tasten, true);
  };

  /** Entfernt den eingetippten Slash-Befehl und wandelt den Block um. */
  const umwandelnNachSlash = (ct, block, typId) => {
    ct.textContent = (ct.textContent || '').replace(/\/[^\/]*$/, '');
    Store.updateBlock(block.id, { text: ct.textContent });
    umwandeln(block.id, typId);
  };

  /* ========================================================================
   * BLOCK-HANDLE-MENÜ
   * ======================================================================*/
  const blockMenue = (anker, b) => {
    const r = anker.getBoundingClientRect();
    const FARBEN = [
      ['default','Standard'],['gray','Grau'],['brown','Braun'],['orange','Orange'],['yellow','Gelb'],
      ['green','Grün'],['blue','Blau'],['purple','Lila'],['pink','Pink'],['red','Rot']
    ];

    const html =
      '<button data-a="turn"><span class="mi">⇄</span>Umwandeln in<span class="ms">▸</span></button>' +
      '<button data-a="color"><span class="mi">🎨</span>Farbe<span class="ms">▸</span></button>' +
      '<button data-a="ai"><span class="mi">✨</span>Mit KI bearbeiten</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentar<span class="ms">Ctrl+Shift+M</span></button>' +
      '<hr>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren<span class="ms">Ctrl+D</span></button>' +
      '<button data-a="up"><span class="mi">↑</span>Nach oben<span class="ms">Ctrl+Shift+↑</span></button>' +
      '<button data-a="down"><span class="mi">↓</span>Nach unten<span class="ms">Ctrl+Shift+↓</span></button>' +
      '<button data-a="moveto"><span class="mi">➦</span>Verschieben nach …</button>' +
      '<hr>' +
      '<button data-a="copy"><span class="mi">⎘</span>Text kopieren<span class="ms">Ctrl+C</span></button>' +
      '<button data-a="cut"><span class="mi">✂</span>Ausschneiden<span class="ms">Ctrl+X</span></button>' +
      '<button data-a="link"><span class="mi">🔗</span>Link zum Block kopieren</button>' +
      '<button data-a="ref"><span class="mi">((</span>Blockverweis kopieren</button>' +
      '<button data-a="karte"><span class="mi">🎴</span>Zur Karteikarte machen</button>' +
      '<hr>' +
      '<button data-a="del"><span class="mi">🗑</span>Löschen<span class="ms">Del</span></button>';

    const menu = UI.menu(html, r.right + 6, r.top);

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-a]');
      if (!btn) return;
      const a = btn.dataset.a;

      if (a === 'turn') {
        menu.innerHTML = '<div class="grp">Umwandeln in</div>' +
          UMWANDELBAR.map(id => {
            const t = typ(id);
            return `<button data-t="${id}"><span class="mi">${t.icon}</span>${t.name}</button>`;
          }).join('');
        menu.addEventListener('click', (ev) => {
          const t = ev.target.closest('button[data-t]');
          if (t) { menu.remove(); umwandeln(b.id, t.dataset.t); }
        });
        return;
      }

      if (a === 'color') {
        menu.innerHTML = '<div class="grp">Textfarbe</div><div class="swatches">' +
          FARBEN.map(([f, n]) =>
            `<button data-c="${f}" title="${n}" style="background:var(--c-${f})"></button>`).join('') +
          '</div><div class="grp">Hintergrund</div><div class="swatches">' +
          FARBEN.slice(1).map(([f, n]) =>
            `<button data-c="bg-${f}" title="${n}" style="background:var(--b-${f})"></button>`).join('') +
          '</div>';
        menu.addEventListener('click', (ev) => {
          const c = ev.target.closest('button[data-c]');
          if (c) {
            Store.updateBlock(b.id, { color: c.dataset.c === 'default' ? '' : c.dataset.c });
            menu.remove();
            App.zeichneSeite();
          }
        });
        return;
      }

      menu.remove();
      if (a === 'dup')  dupliziere(b);
      if (a === 'up')   verschiebe(b, -1);
      if (a === 'down') verschiebe(b, 1);
      if (a === 'link') {
        navigator.clipboard?.writeText(location.origin + location.pathname + '#' + App.aktuelleSeite() + ':' + b.id);
        UI.toast('Link zum Block kopiert');
      }
      if (a === 'ref') {
        navigator.clipboard?.writeText('((' + b.id + '))');
        UI.toast('Blockverweis kopiert — irgendwo einfügen');
      }
      if (a === 'copy') { navigator.clipboard?.writeText(b.text || ''); UI.toast('Text kopiert'); }
      if (a === 'cut') {
        navigator.clipboard?.writeText(b.text || '');
        Store.trashBlock(b.id); Store.purgeBlock(b.id); App.zeichneSeite();
        UI.toast('Ausgeschnitten');
      }
      if (a === 'komm') Kommentare.neu(b);
      if (a === 'karte') {
        const t = b.text || '';
        Store.updateBlock(b.id, { type: 'flashcard', text: t.includes('::') ? t : t + ' :: ' });
        App.zeichneSeite(b.id, 'ende');
        UI.toast('Karteikarte — Frage :: Antwort');
      }
      if (a === 'moveto') {
        Blocks.blockVerschiebenNach(b);
      }
      if (a === 'ai')  KI.blockAktion('ai-edit', b);
      if (a === 'del') { Store.trashBlock(b.id); Store.purgeBlock(b.id); App.zeichneSeite(); }
    });
  };

  /** Einen Block auf eine andere Seite verschieben. */
  const blockVerschiebenNach = (b) => {
    seitenPicker('Auf welche Seite verschieben?', (zielId) => {
      const daten = Store.baum(b.id);
      Store.baumEinfuegen(daten, zielId);
      Store.trashBlock(b.id); Store.purgeBlock(b.id);
      App.zeichneSeite();
      UI.toast('Block verschoben');
    });
  };

  return {
    TYPEN, typ, render, bindeEditor, umwandeln, umwandelnMenue, inline, esc,
    cursorAnsEnde, slashMenue, einfuegenAmEnde, dupliziere, verschiebe,
    blockVerschiebenNach, seitenPicker, blockMenue, datenbankWaehlen,
    DIENSTE, einbettungsAdresse
  };
})();
