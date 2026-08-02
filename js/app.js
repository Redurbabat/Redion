/* ============================================================================
 * app.js — Die Anwendung
 * ----------------------------------------------------------------------------
 * Hält alles zusammen: Seitenleiste, Seitenanzeige, Suche, Tastenkürzel,
 * Einstellungen, Papierkorb, Sicherung, Navigation.
 * ==========================================================================*/

/* ==========================================================================
 * KLEINE OBERFLÄCHENHELFER
 * ========================================================================*/
const UI = (() => {

  /** Öffnet ein Menü an einer Position. Schliesst sich beim Klick daneben. */
  const menu = (html, x, y) => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = html;
    document.body.appendChild(m);

    /* Nicht über den Rand hinausragen lassen */
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth  - r.width  - 8)) + 'px';
    m.style.top  = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';

    setTimeout(() => {
      const zu = (e) => {
        if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', zu); }
      };
      document.addEventListener('mousedown', zu);
    }, 0);
    return m;
  };

  let toastTimer = null;
  const toast = (text) => {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  };

  /** Die Emoji-Auswahl mit Suchfeld liegt in notion.js. */
  const emojiWaehlen = (anker, beiWahl) => Erwaehnung.emojiWaehler(anker, beiWahl);

  /** Kleiner Dialog mit Eingabefeld — statt des nackten prompt(). */
  const frage = (titel, vorgabe = '') => new Promise(ok => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(460px,94vw)">' +
        `<div class="fh">${titel}</div>` +
        `<div style="padding:16px 18px"><input id="fq" value="${String(vorgabe).replace(/"/g, '&quot;')}" ` +
        'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
        'border-radius:8px; outline:none; font-size:15px"></div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
        '<button data-a="zu">Abbrechen</button></div></div>';
    document.body.appendChild(o);
    const inp = o.querySelector('#fq');
    const fertig = (wert) => { o.remove(); ok(wert); };
    o.addEventListener('click', e => {
      if (e.target.closest('[data-a="ok"]')) fertig(inp.value);
      else if (e.target.closest('[data-a="zu"]') || e.target === o) fertig(null);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') fertig(inp.value);
      if (e.key === 'Escape') fertig(null);
    });
    inp.focus(); inp.select();
  });

  return { menu, toast, emojiWaehlen, frage };
})();


/* ==========================================================================
 * DIE ANWENDUNG
 * ========================================================================*/
const App = (() => {

  let seiteId = null;
  const esc = (s) => String(s ?? '').replace(/[<>&]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;' }[c]));

  const aktuelleSeite = () => seiteId;
  const setzeSeite = (id) => { seiteId = id; };

  /* --- Navigationsverlauf (Strg + [ und Strg + ]) ------------------------ */
  const rueck = [], vor = [];
  let navSperre = false;

  const zurueck = () => {
    if (!rueck.length) { UI.toast('Kein Schritt zurück'); return; }
    const id = rueck.pop();
    if (seiteId) vor.push(seiteId);
    navSperre = true; oeffne(id); navSperre = false;
  };
  const vorwaerts = () => {
    if (!vor.length) { UI.toast('Kein Schritt vorwärts'); return; }
    const id = vor.pop();
    if (seiteId) rueck.push(seiteId);
    navSperre = true; oeffne(id); navSperre = false;
  };

  /* ========================================================================
   * SEITENLEISTE
   * ======================================================================*/
  const zeichneBaum = () => {
    const baum = document.getElementById('tree');
    baum.innerHTML = '';

    /* Werkzeuge — die Funktionen der anderen Programme haben hier ihren Ort */
    const wz = document.createElement('div');
    wz.className = 'wz-block';
    wz.innerHTML = [
      ['journal', '📅', 'Journal', 'Tageseintrag — Strg Shift J'],
      ['memos',   '⚡', 'Schnellnotizen', 'Kurze Gedanken — Strg Shift M'],
      ['vorlagen','🧩', 'Vorlagen', 'Seiten als Vorlage wiederverwenden'],
      ['graph',   '🕸', 'Graph', 'Wie alles zusammenhängt — Strg Shift G'],
      ['tags',    '🏷', 'Schlagwörter', 'Alle #Schlagwörter — Strg Shift T'],
      ['lernen',  '🎴', 'Karteikarten', 'Wiederholen nach Plan']
    ].map(([a, i, n, t]) =>
      `<button class="side-item" data-wz="${a}" title="${t}"><span>${i}</span><span>${n}</span>` +
      (a === 'lernen' ? '<span class="k" id="lz"></span>' : '') + '</button>').join('');
    wz.addEventListener('click', e => {
      const b = e.target.closest('[data-wz]');
      if (!b) return;
      const a = b.dataset.wz;
      if (a === 'journal') Werkzeuge.journal();
      if (a === 'memos') Werkzeuge.schnellnotizen();
      if (a === 'vorlagen') Werkzeuge.vorlagen();
      if (a === 'graph') Links.graph();
      if (a === 'tags') Links.tagRegister();
      if (a === 'lernen') Werkzeuge.lernen();
    });
    baum.appendChild(abschnitt('Werkzeuge'));
    baum.appendChild(wz);

    const faellig = Werkzeuge.faellig().length;
    const lz = wz.querySelector('#lz');
    if (lz && faellig) lz.textContent = faellig;

    /* Favoriten */
    const favs = Store.favorites();
    if (favs.length) {
      baum.appendChild(abschnitt('Favoriten'));
      favs.forEach(p => baum.appendChild(zeile(p, 0)));
    }

    /* Privat */
    const kopf = abschnitt('Privat', () => {
      const p = Store.addPage(null, { text: '' });
      zeichneBaum();
      oeffne(p.id);
      setTimeout(() => document.getElementById('title')?.focus(), 60);
    });
    baum.appendChild(kopf);

    const seiten = Store.rootPages().filter(p => !p.system);
    if (!seiten.length) {
      const leer = document.createElement('div');
      leer.style.cssText = 'padding:8px 14px; font-size:13px; color:var(--text-faint)';
      leer.textContent = 'Noch keine Seiten';
      baum.appendChild(leer);
    }
    seiten.forEach(p => baum.appendChild(zeile(p, 0)));

    /* Systemseiten (Journal, Vorlagen, Schnellnotizen) getrennt unten */
    const sys = Store.rootPages().filter(p => p.system);
    if (sys.length) {
      baum.appendChild(abschnitt('Angelegt von den Werkzeugen'));
      sys.forEach(p => baum.appendChild(zeile(p, 0)));
    }
  };

  const abschnitt = (name, beiPlus) => {
    const d = document.createElement('div');
    d.className = 'side-section';
    d.innerHTML = `<span>${name}</span>`;
    if (beiPlus) {
      const b = document.createElement('button');
      b.textContent = '+';
      b.title = 'Neue Seite';
      b.addEventListener('click', beiPlus);
      d.appendChild(b);
    }
    return d;
  };

  const zeile = (p, tiefe) => {
    const w = document.createElement('div');
    const r = document.createElement('div');
    r.className = 'row' + (p.id === seiteId ? ' on' : '');
    r.draggable = true;

    const kinder = Store.childrenOf(p.id).filter(k => k.type === 'page');
    const offen = !!p.aufgeklappt;

    const tw = document.createElement('div');
    tw.className = 'tw';
    tw.textContent = kinder.length ? (offen ? '▾' : '▸') : '';
    tw.addEventListener('click', e => {
      e.stopPropagation();
      if (!kinder.length) return;
      Store.updateBlock(p.id, { aufgeklappt: !offen });
      zeichneBaum();
    });

    const ico = document.createElement('div');
    ico.className = 'ico';
    ico.textContent = p.icon || '📄';

    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = p.text || 'Ohne Titel';
    if (p.locked) nm.textContent = '🔒 ' + nm.textContent;

    const act = document.createElement('div');
    act.className = 'act';
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.title = 'Unterseite';
    plus.addEventListener('click', e => {
      e.stopPropagation();
      const k = Store.addPage(p.id, { text: '' });
      Store.updateBlock(p.id, { aufgeklappt: true });
      zeichneBaum();
      oeffne(k.id);
      setTimeout(() => document.getElementById('title')?.focus(), 60);
    });
    const mehr = document.createElement('button');
    mehr.textContent = '⋯';
    mehr.addEventListener('click', e => { e.stopPropagation(); seitenMenue(mehr, p); });
    act.appendChild(plus);
    act.appendChild(mehr);

    r.append(tw, ico, nm, act);
    r.addEventListener('click', () => oeffne(p.id));

    /* Seiten in der Leiste umhängen */
    r.addEventListener('dragstart', e => { e.dataTransfer.setData('text/seite', p.id); });
    r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('drop'); });
    r.addEventListener('dragleave', () => r.classList.remove('drop'));
    r.addEventListener('drop', e => {
      e.preventDefault(); r.classList.remove('drop');
      const quelle = e.dataTransfer.getData('text/seite');
      if (quelle && quelle !== p.id) {
        const q = Store.getBlock(quelle);
        if (q) Werkzeuge.verschiebe(q, p.id);
      }
    });

    w.appendChild(r);

    if (offen && kinder.length) {
      const k = document.createElement('div');
      k.className = 'kids';
      kinder.forEach(kid => k.appendChild(zeile(kid, tiefe + 1)));
      w.appendChild(k);
    }
    return w;
  };

  /* ========================================================================
   * DAS SEITENMENÜ (⋯) — der vollständige Notion-Umfang
   * ======================================================================*/
  const seitenMenue = (anker, p) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      /* Darstellung */
      '<button data-a="stil"><span class="mi">🅰</span>Schriftstil<span class="ms">▸</span></button>' +
      `<button data-a="klein"><span class="mi">↕</span>Kleiner Text<span class="ms">${p.small ? 'an' : 'aus'}</span></button>` +
      `<button data-a="breit"><span class="mi">↔</span>Volle Breite<span class="ms">${p.wide ? 'an' : 'aus'}</span></button>` +
      '<button data-a="anpassen"><span class="mi">⚙</span>Seite anpassen<span class="ms">▸</span></button>' +
      '<hr>' +
      /* Seitenaktionen */
      `<button data-a="fav"><span class="mi">${p.favorite ? '★' : '☆'}</span>` +
      `${p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}</button>` +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="icon"><span class="mi">😀</span>Symbol ändern</button>' +
      '<button data-a="cover"><span class="mi">🖼</span>Cover ändern</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren</button>' +
      '<button data-a="link"><span class="mi">🔗</span>Link kopieren</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentare</button>' +
      '<hr>' +
      /* Daten */
      '<button data-a="export"><span class="mi">⭳</span>Als Markdown</button>' +
      '<button data-a="import"><span class="mi">⭱</span>Markdown einlesen</button>' +
      Werkzeuge.seitenMenueZusatz(p) +
      '<hr>' +
      `<button data-a="stat2"><span class="mi">📈</span>Seitenaufrufe<span class="ms">${p.aufrufe || 0}</span></button>` +
      '<button data-a="papier"><span class="mi">🗑</span>Gelöschte Seiten</button>' +
      '<button data-a="del"><span class="mi">🗑</span>In den Papierkorb</button>',
      r.right + 4, r.top);

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      /* Untermenüs bleiben offen */
      if (a === 'icon') {
        m.remove();
        UI.emojiWaehlen(anker, (em) => {
          Store.updateBlock(p.id, { icon: em });
          zeichneBaum();
          if (p.id === seiteId) zeichneSeite();
        });
        return;
      }
      if (a === 'stil') {
        m.innerHTML = '<div class="grp">Schrift</div>' +
          '<button data-f="default">Standard</button><button data-f="serif">Serif</button>' +
          '<button data-f="mono">Monospace</button>';
        m.addEventListener('click', ev => {
          const f = ev.target.closest('button[data-f]');
          if (!f) return;
          Store.updateBlock(p.id, { font: f.dataset.f });
          m.remove(); zeichneSeite();
        });
        return;
      }
      if (a === 'anpassen') {
        m.innerHTML = '<div class="grp">Was auf der Seite erscheint</div>' +
          `<button data-o="rueck">Rückverweise<span class="ms">${p.ohneRueck ? 'aus' : 'an'}</span></button>` +
          `<button data-o="werkzeuge">Werkzeugzeile<span class="ms">${p.ohneTools ? 'aus' : 'an'}</span></button>` +
          `<button data-o="gesperrt">Bearbeiten<span class="ms">${p.gesperrt ? 'gesperrt' : 'erlaubt'}</span></button>`;
        m.addEventListener('click', ev => {
          const o = ev.target.closest('button[data-o]');
          if (!o) return;
          if (o.dataset.o === 'rueck') Store.updateBlock(p.id, { ohneRueck: !p.ohneRueck });
          if (o.dataset.o === 'werkzeuge') Store.updateBlock(p.id, { ohneTools: !p.ohneTools });
          if (o.dataset.o === 'gesperrt') Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
          m.remove(); zeichneSeite();
        });
        return;
      }
      if (a === 'cover') {
        m.remove(); coverWaehlen(p);
        return;
      }

      m.remove();

      if (Werkzeuge.seitenMenueAktion(a, p)) return;

      if (a === 'fav')   { Store.updateBlock(p.id, { favorite: !p.favorite }); zeichneBaum(); }
      if (a === 'klein') { Store.updateBlock(p.id, { small: !p.small }); zeichneSeite(); }
      if (a === 'breit') { Store.updateBlock(p.id, { wide: !p.wide }); zeichneSeite(); }
      if (a === 'rename') {
        const n = await UI.frage('Neuer Titel', p.text);
        if (n !== null) { Store.updateBlock(p.id, { text: n }); zeichneBaum(); if (p.id === seiteId) zeichneSeite(); }
      }
      if (a === 'dup')  { dupliziereSeite(p.id, p.parentId); zeichneBaum(); UI.toast('Seite dupliziert'); }
      if (a === 'link') { navigator.clipboard?.writeText(location.origin + location.pathname + '#' + p.id); UI.toast('Link kopiert'); }
      if (a === 'komm') Kommentare.panel(p.id);
      if (a === 'export') markdownExport(p);
      if (a === 'import') {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.md,.markdown,.txt';
        inp.addEventListener('change', async () => {
          const f = inp.files[0]; if (!f) return;
          Werkzeuge.ausMarkdown(p, await f.text());
          zeichneSeite(); UI.toast('Markdown eingelesen');
        });
        inp.click();
      }
      if (a === 'stat2') {
        UI.toast(`Diese Seite wurde ${p.aufrufe || 0}-mal geöffnet · zuletzt geändert ` +
                 Werkzeuge.zeitKurz(p.edited));
      }
      if (a === 'papier') papierkorb();
      if (a === 'del') {
        Store.trashBlock(p.id);
        zeichneBaum();
        if (p.id === seiteId) { const e2 = Store.rootPages()[0]; oeffne(e2 ? e2.id : null); }
        UI.toast('In den Papierkorb verschoben');
      }
    });
  };

  const coverWaehlen = (p) => {
    const farben = [
      'linear-gradient(120deg,#2eaadc,#9a6dd7)', 'linear-gradient(120deg,#ffa344,#ff7369)',
      'linear-gradient(120deg,#4dab9a,#529cca)', 'linear-gradient(120deg,#e255a1,#9a6dd7)',
      'linear-gradient(120deg,#37352f,#787774)', 'linear-gradient(120deg,#ffdc49,#ffa344)',
      'linear-gradient(200deg,#529cca,#4dab9a)', '#2eaadc', '#9a6dd7', '#4dab9a'
    ];
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Cover wählen</div>' +
        '<div class="cover-gitter">' +
          farben.map(f => `<button data-c="${f}" style="background:${f}"></button>`).join('') +
        '</div>' +
        '<div class="fbtns"><button data-a="bild">Eigenes Bild …</button>' +
        '<button data-a="weg">Cover entfernen</button><button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      const c = e.target.closest('[data-c]');
      if (c) { Store.updateBlock(p.id, { cover: c.dataset.c }); o.remove(); zeichneSeite(); return; }
      if (e.target.closest('[data-a="weg"]')) { Store.updateBlock(p.id, { cover: '' }); o.remove(); zeichneSeite(); return; }
      if (e.target.closest('[data-a="bild"]')) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', () => {
          const f = inp.files[0]; if (!f) return;
          if (f.size > 6 * 1024 * 1024) { UI.toast('Bitte ein Bild unter 6 MB'); return; }
          const r = new FileReader();
          r.onload = () => { Store.updateBlock(p.id, { cover: r.result }); o.remove(); zeichneSeite(); };
          r.readAsDataURL(f);
        });
        inp.click();
        return;
      }
      if (e.target.closest('[data-a="zu"]') || e.target === o) o.remove();
    });
  };

  const dupliziereSeite = (id, zielEltern) => {
    const daten = Store.baum(id);
    const neu = Store.baumEinfuegen(daten, zielEltern);
    if (neu) Store.updateBlock(neu.id, { text: (Store.getBlock(id).text || 'Ohne Titel') + ' (Kopie)' });
    return neu;
  };

  /* ========================================================================
   * SEITE ANZEIGEN
   * ======================================================================*/
  const oeffne = (id) => {
    if (seiteId && seiteId !== id && !navSperre) { rueck.push(seiteId); vor.length = 0; }
    if (seiteId && seiteId !== id) Werkzeuge.versionAutomatisch(seiteId);
    seiteId = id;
    if (id) {
      const p = Store.getBlock(id);
      if (p) Store.updateBlock(id, { aufrufe: (p.aufrufe || 0) + 1, zuletztGeoeffnet: Store.now() });
    }
    Store.setMeta('letzte', id);
    location.hash = id || '';
    zeichneBaum();
    zeichneSeite();
    document.getElementById('scroll').scrollTop = 0;
  };

  /**
   * Zeichnet die offene Seite neu.
   * @param {string} fokus  ID des Blocks, der danach den Cursor bekommt
   * @param {string} wo     'ende' setzt den Cursor ans Textende
   */
  const zeichneSeite = (fokus = null, wo = 'anfang') => {
    const wrap = document.getElementById('page');
    const p = seiteId ? Store.getBlock(seiteId) : null;

    if (!p) {
      wrap.innerHTML =
        '<div style="padding:22vh 0; text-align:center; color:var(--text-faint)">' +
        '<div style="font-size:44px; margin-bottom:14px">📓</div>' +
        '<div style="font-size:17px; margin-bottom:6px">Noch keine Seite geöffnet</div>' +
        '<div style="font-size:14px">Links auf <b>+</b> klicken oder <b>Strg + N</b> drücken</div></div>';
      zeichneCrumbs();
      return;
    }

    wrap.className = p.wide ? 'wide' : '';
    document.body.dataset.font = p.font || 'default';
    document.body.dataset.small = p.small ? '1' : '';
    wrap.innerHTML = '';

    /* Cover */
    if (p.cover) {
      const c = document.createElement('div');
      c.className = 'cover';
      c.style.background = p.cover.startsWith('#') || p.cover.startsWith('linear')
        ? p.cover : `url(${p.cover}) center/cover`;
      wrap.appendChild(c);
    }

    /* Symbol */
    const ico = document.createElement('div');
    ico.className = 'pg-icon';
    ico.textContent = p.icon || '📄';
    ico.addEventListener('click', () => UI.emojiWaehlen(ico, (e) => {
      Store.updateBlock(p.id, { icon: e });
      zeichneSeite(); zeichneBaum();
    }));
    wrap.appendChild(ico);

    /* Titel */
    const t = document.createElement('div');
    t.id = 'title';
    t.contentEditable = p.gesperrt ? 'false' : 'true';
    t.spellcheck = false;
    t.textContent = p.text || '';
    t.addEventListener('input', () => {
      Store.updateBlock(p.id, { text: t.textContent });
      zeichneBaum();
    });
    t.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const erste = Store.childrenOf(p.id)[0];
        if (erste) {
          const ct = document.querySelector(`[data-bid="${erste.id}"] .ct`);
          if (ct) ct.focus();
        } else {
          const b = Store.addBlock(p.id, 'text');
          zeichneSeite(b.id);
        }
      }
    });
    wrap.appendChild(t);

    /* Hinweis bei gesperrter Seite */
    if (p.gesperrt) {
      const h = document.createElement('div');
      h.className = 'sperrhinweis';
      h.innerHTML = '🔏 Diese Seite ist gegen Bearbeiten gesperrt. ' +
                    '<button data-a="auf">Bearbeiten erlauben</button>';
      h.addEventListener('click', e => {
        if (e.target.closest('[data-a="auf"]')) {
          Store.updateBlock(p.id, { gesperrt: false }); zeichneSeite();
        }
      });
      wrap.appendChild(h);
    }

    /* Verschlüsselte Seite: nur der Sperrbildschirm */
    if (p.locked) {
      Werkzeuge.sperrAnsicht(p, wrap);
      zeichneCrumbs();
      return;
    }

    /* Werkzeugzeile */
    if (!p.ohneTools) {
      const tools = document.createElement('div');
      tools.className = 'pg-tools';
      tools.innerHTML =
        '<button data-a="cover">🖼 Cover</button>' +
        '<button data-a="wide">' + (p.wide ? '↹ Normale Breite' : '↔ Volle Breite') + '</button>' +
        '<button data-a="font">🅰 Schrift</button>' +
        '<button data-a="vorlage">🧩 Vorlage</button>' +
        '<button data-a="ai">✨ Mit KI</button>';
      tools.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'cover') coverWaehlen(p);
        if (a === 'wide') { Store.updateBlock(p.id, { wide: !p.wide }); zeichneSeite(); }
        if (a === 'vorlage') Werkzeuge.vorlageEinfuegen(p);
        if (a === 'font') {
          const r = b.getBoundingClientRect();
          const m = UI.menu(
            '<button data-f="default">Standard</button>' +
            '<button data-f="serif">Serif</button>' +
            '<button data-f="mono">Monospace</button>' +
            '<hr><button data-f="small">Kleiner Text an/aus</button>', r.left, r.bottom + 4);
          m.addEventListener('click', ev => {
            const f = ev.target.closest('button[data-f]');
            if (!f) return;
            if (f.dataset.f === 'small') Store.updateBlock(p.id, { small: !p.small });
            else Store.updateBlock(p.id, { font: f.dataset.f });
            m.remove(); zeichneSeite();
          });
        }
        if (a === 'ai') kiPanel(true);
      });
      wrap.appendChild(tools);
    }

    /* Blöcke */
    const kinder = Store.childrenOf(p.id);
    if (!kinder.length && !p.gesperrt) {
      const b = Store.addBlock(p.id, 'text');
      kinder.push(b);
    }
    let nr = 0;
    kinder.forEach(b => {
      if (b.type === 'number') { nr++; b.nr = nr; } else nr = 0;
      wrap.appendChild(Blocks.render(b));
    });

    /* Rückverweise unter der Seite */
    if (!p.ohneRueck) Links.fusszeile(p, wrap);

    zeichneCrumbs();

    /* Fokus setzen */
    if (fokus) {
      const ct = document.querySelector(`[data-bid="${fokus}"] .ct`);
      if (ct) { if (wo === 'ende') Blocks.cursorAnsEnde(ct); else ct.focus(); }
    }
  };

  const zeichneCrumbs = () => {
    const c = document.getElementById('crumb');
    if (!seiteId) { c.innerHTML = ''; return; }
    const pfad = Store.pathOf(seiteId);
    c.innerHTML = pfad.map((p, i) =>
      `<a data-id="${p.id}">${p.icon || ''} ${esc(p.text || 'Ohne Titel')}</a>` +
      (i < pfad.length - 1 ? '<span class="sep">/</span>' : '')).join('');
    c.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => oeffne(a.dataset.id)));

    /* Stern und Kommentarzähler in der Kopfzeile */
    const p = Store.getBlock(seiteId);
    const stern = document.getElementById('btn-fav');
    if (stern && p) {
      stern.textContent = p.favorite ? '★' : '☆';
      stern.classList.toggle('on', !!p.favorite);
    }
    const kb = document.getElementById('btn-komm');
    if (kb && p) {
      const n = Kommentare.offeneAnzahl(p.id);
      kb.textContent = n ? '💬 ' + n : '💬';
    }
  };

  /* ========================================================================
   * SUCHE
   * ======================================================================*/
  const suche = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<input id="q" placeholder="Seiten und Inhalte durchsuchen …" autocomplete="off">' +
        '<div class="res" id="res"></div>' +
        '<div class="hint">↑ ↓ auswählen · Enter öffnen · Esc schliessen · Strg Shift P für Befehle</div>' +
      '</div>';
    document.body.appendChild(o);

    const inp = o.querySelector('#q');
    const res = o.querySelector('#res');
    let treffer = [];
    let i = 0;

    const zeichne = () => {
      if (!treffer.length) {
        res.innerHTML = inp.value
          ? '<div style="padding:14px; color:var(--text-faint); font-size:14px">Nichts gefunden</div>'
          : '';
        return;
      }
      res.innerHTML = treffer.map((t, k) =>
        `<button data-i="${k}" ${k === i ? 'class="on"' : ''}>` +
          `<span>${t.page.icon || '📄'}</span>` +
          `<span style="flex:1"><span>${esc(t.page.text || 'Ohne Titel')}</span>` +
          (t.treffer === 'Inhalt' ? `<span class="snip">${esc(t.snippet)}</span>` : '') +
          `</span><span class="pth">${t.treffer}</span></button>`).join('');
      res.querySelectorAll('button').forEach(b =>
        b.addEventListener('click', () => { oeffne(treffer[+b.dataset.i].page.id); o.remove(); }));
      res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
    };

    const zuletzt = () => {
      treffer = Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
        .sort((a, b) => (b.edited || '').localeCompare(a.edited || ''))
        .slice(0, 8)
        .map(p => ({ page: p, treffer: 'Zuletzt', snippet: '' }));
      i = 0;
      zeichne();
    };
    zuletzt();

    inp.addEventListener('input', () => {
      if (!inp.value.trim()) { zuletzt(); return; }
      treffer = Store.search(inp.value);
      i = 0;
      zeichne();
    });

    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { o.remove(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); i = Math.min(i + 1, treffer.length - 1); zeichne(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); i = Math.max(i - 1, 0); zeichne(); }
      if (e.key === 'Enter' && treffer[i]) { oeffne(treffer[i].page.id); o.remove(); }
    });

    o.addEventListener('mousedown', e => { if (e.target === o) o.remove(); });
    inp.focus();
  };

  /** Suchen auf der offenen Seite — Strg + F. */
  const seitenSuche = () => {
    const alt = document.getElementById('findbar');
    if (alt) { alt.remove(); zeichneSeite(); return; }
    const bar = document.createElement('div');
    bar.id = 'findbar';
    bar.innerHTML = '<input placeholder="Auf dieser Seite suchen …"><span class="n"></span>' +
                    '<button data-a="zu">✕</button>';
    document.body.appendChild(bar);
    const inp = bar.querySelector('input');
    const n = bar.querySelector('.n');

    const suchen = () => {
      document.querySelectorAll('#page mark').forEach(m => m.replaceWith(...m.childNodes));
      const q = inp.value.trim();
      if (!q) { n.textContent = ''; return; }
      let anzahl = 0;
      const lauf = document.createTreeWalker(document.getElementById('page'), NodeFilter.SHOW_TEXT);
      const knoten = [];
      while (lauf.nextNode()) knoten.push(lauf.currentNode);
      knoten.forEach(k => {
        const i = k.nodeValue.toLowerCase().indexOf(q.toLowerCase());
        if (i < 0) return;
        const nach = k.splitText(i);
        nach.splitText(q.length);
        const mark = document.createElement('mark');
        mark.textContent = nach.nodeValue;
        nach.replaceWith(mark);
        if (!anzahl) mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        anzahl++;
      });
      n.textContent = anzahl ? anzahl + ' Treffer' : 'nichts';
    };
    inp.addEventListener('input', suchen);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { bar.remove(); zeichneSeite(); }
    });
    bar.addEventListener('click', e => {
      if (e.target.closest('[data-a="zu"]')) { bar.remove(); zeichneSeite(); }
    });
    inp.focus();
  };

  /* ========================================================================
   * PAPIERKORB
   * ======================================================================*/
  const papierkorb = () => {
    const liste = Store.trashed();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<div class="fh">Papierkorb <em>' + liste.length + '</em></div>' +
        '<div class="res">' +
          (liste.length
            ? liste.map(p =>
                `<button data-id="${p.id}">` +
                `<span>${p.icon || '📄'}</span>` +
                `<span style="flex:1">${esc(p.text || 'Ohne Titel')}` +
                `<span class="snip">gelöscht ${esc(Werkzeuge.zeitKurz(p.trashedAt))}</span></span>` +
                `<span class="pth" data-a="restore" style="color:var(--accent);cursor:pointer">Wiederherstellen</span>` +
                `<span class="pth" data-a="purge" style="color:var(--c-red);cursor:pointer;margin-left:10px">Endgültig</span>` +
                `</button>`).join('')
            : '<div style="padding:16px; color:var(--text-faint); font-size:14px">Der Papierkorb ist leer</div>') +
        '</div>' +
        '<div class="hint">Endgültig gelöschte Seiten lassen sich nicht mehr zurückholen.</div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      const s = e.target.closest('[data-a]');
      const b = e.target.closest('button[data-id]');
      if (!b) { if (e.target === o) o.remove(); return; }
      const id = b.dataset.id;
      if (s && s.dataset.a === 'restore') { Store.restoreBlock(id); o.remove(); zeichneBaum(); UI.toast('Wiederhergestellt'); return; }
      if (s && s.dataset.a === 'purge') {
        if (!confirm('Endgültig löschen? Das lässt sich nicht rückgängig machen.')) return;
        Store.purgeBlock(id); o.remove(); papierkorb(); UI.toast('Endgültig gelöscht'); return;
      }
      Store.restoreBlock(id); o.remove(); oeffne(id);
    });
  };

  /* ========================================================================
   * EINSTELLUNGEN
   * ======================================================================*/
  const einstellungen = async () => {
    const u = await Store.usage();
    const platz = u
      ? `${(u.benutzt / 1048576).toFixed(1)} MB von etwa ${(u.verfuegbar / 1048576 / 1024).toFixed(1)} GB`
      : 'unbekannt';
    const anzahlSeiten = Links.seiten().length;
    const name = Store.getMeta('nutzer', '');

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(640px,95vw)">' +
        '<div class="fh">Einstellungen<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="einst">' +

          '<div class="eb"><b>Konto</b>' +
            '<div class="ez">Dein Name erscheint bei Kommentaren und Erwähnungen.</div>' +
            `<input id="nutzer" value="${esc(name)}" placeholder="Dein Name">` +
          '</div>' +

          '<div class="eb"><b>Erscheinungsbild</b>' +
            '<div class="ereihe">' +
              '<button data-a="dark">Dunkel</button>' +
              '<button data-a="light">Hell</button>' +
              '<button data-a="system">Wie das System</button>' +
            '</div>' +
          '</div>' +

          '<div class="eb"><b>Deine Daten</b>' +
            `<div class="ez">${anzahlSeiten} Seiten · ${platz} belegt<br>` +
            'Alles liegt in diesem Browser. Nichts wird hochgeladen.</div>' +
            '<div class="ereihe">' +
              '<button data-a="export">Sicherung speichern</button>' +
              '<button data-a="import">Sicherung laden</button>' +
              '<button data-a="wipe" class="warn">Alles löschen</button>' +
            '</div>' +
          '</div>' +

          '<div class="eb"><b>Ordner und Dateien</b>' +
            '<div class="ez">Alle Seiten als einzelne Markdown-Dateien — so, wie Joplin, ' +
            'Zettlr und SilverBullet ihre Notizen ablegen.</div>' +
            '<div class="ereihe">' +
              '<button data-a="ordner-schreiben">In Ordner schreiben</button>' +
              '<button data-a="ordner-lesen">Ordner einlesen</button>' +
              '<button data-a="einzeldatei">Alles als eine HTML-Datei</button>' +
            '</div>' +
          '</div>' +

          '<div class="eb"><b>Künstliche Intelligenz</b>' +
            '<div class="ez">Zwei Wege, beide kostenlos und lokal:<br>' +
            '<b>Ollama</b> auf dem Rechner — schneller und besser.<br>' +
            '<b>WebLLM</b> im Browser — ohne Installation.<br>' +
            'Das Modell wählst du oben rechts im KI-Panel.</div>' +
            '<div class="ereihe"><button data-a="ki">KI-Panel öffnen</button></div>' +
          '</div>' +

          '<div class="eb"><b>Benachrichtigungen</b>' +
            '<div class="ez">Erinnerungen melden sich in der App. Mit Erlaubnis auch im System.</div>' +
            '<div class="ereihe"><button data-a="benachr">Benachrichtigungen erlauben</button></div>' +
          '</div>' +

          '<div class="eb"><b>Tastenkürzel</b>' +
            '<div class="ez">Über 60 Kürzel — die vollständige Übersicht mit <code>Strg /</code>.</div>' +
            '<div class="ereihe"><button data-a="kuerzel">Übersicht öffnen</button></div>' +
          '</div>' +

        '</div>' +
        '<div class="hint">Notizen — lokal, offline, ohne Konto.</div>' +
      '</div>';
    document.body.appendChild(o);

    const nutzerFeld = o.querySelector('#nutzer');
    nutzerFeld.addEventListener('input', () => Store.setMeta('nutzer', nutzerFeld.value));

    o.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) { if (e.target === o) o.remove(); return; }
      const a = b.dataset.a;

      if (a === 'zu') { o.remove(); return; }
      if (a === 'dark' || a === 'light') { theme(a); return; }
      if (a === 'system') {
        const dunkel = matchMedia('(prefers-color-scheme: dark)').matches;
        theme(dunkel ? 'dark' : 'light');
        return;
      }
      if (a === 'export') sicherungSpeichern();
      if (a === 'import') sicherungLaden(() => o.remove());
      if (a === 'ordner-schreiben') Werkzeuge.ordnerSchreiben();
      if (a === 'ordner-lesen') Werkzeuge.ordnerLesen();
      if (a === 'einzeldatei') Werkzeuge.einzelDatei();
      if (a === 'ki') { o.remove(); kiPanel(true); }
      if (a === 'kuerzel') { o.remove(); Werkzeuge.tastenkuerzel(); }
      if (a === 'benachr') {
        if (!('Notification' in window)) { UI.toast('Dieser Browser kennt keine Benachrichtigungen'); return; }
        const erg = await Notification.requestPermission();
        UI.toast(erg === 'granted' ? 'Benachrichtigungen erlaubt' : 'Benachrichtigungen bleiben aus');
      }
      if (a === 'wipe') {
        if (!confirm('Wirklich ALLE Seiten und Datenbanken löschen? Das kann nicht rückgängig gemacht werden.')) return;
        if (!confirm('Ganz sicher? Am besten vorher eine Sicherung speichern.')) return;
        await Store.wipe();
        location.reload();
      }
    });
  };

  const sicherungSpeichern = () => {
    const blob = new Blob([Store.exportAll()], { type: 'application/json' });
    const l = document.createElement('a');
    l.href = URL.createObjectURL(blob);
    l.download = 'notizen-sicherung-' + new Date().toISOString().slice(0, 10) + '.json';
    l.click();
    UI.toast('Sicherung gespeichert');
  };

  const sicherungLaden = (danach) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.addEventListener('change', async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        await Store.importAll(await f.text());
        danach && danach();
        zeichneBaum(); zeichneSeite();
        UI.toast('Sicherung geladen');
      } catch (err) { alert('Konnte nicht geladen werden: ' + err.message); }
    });
    inp.click();
  };

  const setzeBreite = (px) => {
    const s = document.getElementById('sidebar');
    s.style.width = px + 'px';
    s.style.flexBasis = px + 'px';
  };

  const theme = (was) => {
    const neu = was || (document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    document.documentElement.dataset.theme = neu;
    Store.setMeta('theme', neu);
  };

  /* ========================================================================
   * EXPORT
   * ======================================================================*/
  const markdownExport = (p) => {
    const md = `# ${p.text || 'Ohne Titel'}\n\n${Werkzeuge.alsMarkdown(p)}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (p.text || 'seite').replace(/[^\wäöüÄÖÜß -]/g, '') + '.md';
    a.click();
    UI.toast('Als Markdown gespeichert');
  };

  /* ========================================================================
   * KI-PANEL
   * ======================================================================*/
  const kiPanel = (auf) => {
    const p = document.getElementById('ai');
    const an = auf === undefined ? !p.classList.contains('open') : auf;
    p.classList.toggle('open', an);
    document.getElementById('btn-ai').classList.toggle('on', an);
    if (an) setTimeout(() => document.getElementById('ai-input').focus(), 60);
  };

  const neueSeite = (elternId = null) => {
    const p = Store.addPage(elternId, { text: '' });
    zeichneBaum(); oeffne(p.id);
    setTimeout(() => document.getElementById('title')?.focus(), 60);
    return p;
  };

  /* ========================================================================
   * TASTENKÜRZEL
   * ======================================================================*/
  const tasten = () => {
    document.addEventListener('keydown', e => {
      const strg = e.ctrlKey || e.metaKey;
      if (!strg) return;
      const k = e.key.toLowerCase();

      if (k === 'n' && !e.shiftKey) { e.preventDefault(); neueSeite(); return; }
      if (k === 'p' && !e.shiftKey) { e.preventDefault(); suche(); return; }
      if (k === 'k' && !e.shiftKey) { e.preventDefault(); suche(); return; }
      if (k === '\\') { e.preventDefault(); document.getElementById('sidebar').classList.toggle('collapsed'); return; }
      if (k === 'j' && !e.shiftKey) { e.preventDefault(); kiPanel(); return; }
      if (e.shiftKey && k === 'l') { e.preventDefault(); theme(); return; }
      if (k === ',') { e.preventDefault(); einstellungen(); return; }
      if (k === '[') { e.preventDefault(); zurueck(); return; }
      if (k === ']') { e.preventDefault(); vorwaerts(); return; }
      if (k === 'f' && !e.shiftKey) { e.preventDefault(); seitenSuche(); return; }
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); Verlauf.zurueck(); return; }
      if ((k === 'y') || (e.shiftKey && k === 'z')) { e.preventDefault(); Verlauf.vor(); return; }
      if (e.shiftKey && k === 'h') { e.preventDefault(); Auswahl.letzteFarbeAnwenden(); return; }
    });

    /* Esc schliesst Menüs und Overlays */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const m = document.querySelector('.menu');
      const o = document.querySelector('.overlay');
      if (m) m.remove();
      else if (o) o.remove();
    });
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = async () => {
    await Store.load();

    document.documentElement.dataset.theme = Store.getMeta('theme', 'dark');

    if (!Store.rootPages().length) beispielAnlegen();

    const ausHash = location.hash.slice(1).split(':')[0];
    const startSeite = (ausHash && Store.getBlock(ausHash)) ? ausHash
                : (Store.getMeta('letzte') && Store.getBlock(Store.getMeta('letzte')))
                  ? Store.getMeta('letzte')
                  : (Store.rootPages()[0] || {}).id;

    zeichneBaum();
    oeffne(startSeite);

    Blocks.bindeEditor(document.getElementById('page'));
    tasten();
    KI.bindePanel();
    KI.start();

    /* Die Zusatzschichten */
    Links.start();
    Werkzeuge.start();
    Verlauf.start();
    Auswahl.start();
    Erwaehnung.start();
    Mehrfach.start();

    /* Seitenleiste und Kopfzeile */
    const an = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    an('btn-search', suche);
    an('btn-cmd', () => Werkzeuge.palette());
    an('btn-home', () => Ansichten.start());
    an('btn-inbox', () => Ansichten.posteingang());
    an('btn-ai', () => kiPanel());
    an('btn-trash', papierkorb);
    an('btn-settings', einstellungen);
    an('btn-theme', () => theme());
    an('btn-side', () => document.getElementById('sidebar').classList.toggle('collapsed'));
    an('btn-new', () => neueSeite());
    an('btn-new-bottom', () => neueSeite());
    an('btn-import', () => Werkzeuge.ordnerLesen());
    an('btn-hilfe', () => Werkzeuge.tastenkuerzel());
    an('btn-back', zurueck);
    an('btn-fwd', vorwaerts);
    an('btn-komm', () => seiteId && Kommentare.panel(seiteId));
    an('btn-verlauf', () => seiteId && Werkzeuge.versionen(Store.getBlock(seiteId)));
    an('btn-fav', () => {
      if (!seiteId) return;
      const p = Store.getBlock(seiteId);
      Store.updateBlock(p.id, { favorite: !p.favorite });
      zeichneBaum(); zeichneCrumbs();
    });
    an('btn-page-menu', (e) => {
      const p = Store.getBlock(seiteId);
      if (p) seitenMenue(e.currentTarget, p);
    });

    /* Seitenleiste in der Breite ziehen — wie in Notion */
    const griff = document.createElement('div');
    griff.id = 'side-griff';
    document.getElementById('sidebar').appendChild(griff);
    const gespeicherteBreite = Store.getMeta('seitenleiste', 0);
    if (gespeicherteBreite) setzeBreite(gespeicherteBreite);
    griff.addEventListener('pointerdown', e => {
      e.preventDefault();
      const zug = (ev) => setzeBreite(Math.max(180, Math.min(460, ev.clientX)));
      const stop = () => {
        removeEventListener('pointermove', zug);
        removeEventListener('pointerup', stop);
        Store.setMeta('seitenleiste', document.getElementById('sidebar').getBoundingClientRect().width);
      };
      addEventListener('pointermove', zug);
      addEventListener('pointerup', stop);
    });

    /* Beim Verlassen noch schnell alles sichern */
    addEventListener('beforeunload', () => Store.flush());
  };

  /* --- Beispielinhalt beim ersten Start ----------------------------------- */
  const beispielAnlegen = () => {
    const p = Store.addPage(null, { text: 'Willkommen', icon: '👋' });
    const b = (typ, text, extra) => Store.addBlock(p.id, typ, Object.assign({ text }, extra || {}));

    b('h1', 'Willkommen in deinen Notizen');
    b('text', 'Alles hier liegt **lokal** in deinem Browser. Kein Konto, kein Server, keine Cloud.');
    b('callout', 'Tippe irgendwo `/` — dann öffnet sich das Blockmenü mit allen Bausteinen.', { icon: '💡' });

    b('h2', 'Was du sofort ausprobieren kannst');
    b('bullet', 'Strg + P sucht, Strg + Shift + P öffnet alle Befehle');
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
        { name: 'Offen',     color: 'gray'   },
        { name: 'In Arbeit', color: 'blue'   },
        { name: 'Erledigt',  color: 'green'  }
      ]},
      pr: { name: 'Priorität', type: 'select', options: [
        { name: 'Niedrig', color: 'gray'   },
        { name: 'Mittel',  color: 'yellow' },
        { name: 'Hoch',    color: 'red'    }
      ]},
      dt: { name: 'Fällig', type: 'date' },
      fx: { name: 'Tage übrig', type: 'formula',
            formula: 'if(empty(prop("Fällig")), "—", format(dateBetween(prop("Fällig"), now(), "days")) + " Tage")' }
    };
    const { collectionId } = Store.addDatabase(p.id, 'Meine Aufgaben', schema, 'table');

    const inTagen = (n) => {
      const d = new Date(); d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    Store.addRow(collectionId, { title: 'App ausprobieren', st: 'In Arbeit', pr: 'Hoch',   dt: inTagen(0) });
    Store.addRow(collectionId, { title: 'Eigene Seite anlegen', st: 'Offen',  pr: 'Mittel', dt: inTagen(2) });
    Store.addRow(collectionId, { title: 'Ollama installieren',  st: 'Offen',  pr: 'Niedrig',dt: inTagen(7) });
    Store.rowsOf(collectionId).forEach(r => {
      if (r.props && r.props.title) { r.text = r.props.title; Store.updateBlock(r.id, { text: r.text }); }
    });

    b('h2', 'Deine Daten gehören dir');
    b('text', 'Unter Einstellungen kannst du jederzeit eine Sicherung speichern und wieder einlesen.');
  };

  return {
    start, oeffne, zeichneSeite, zeichneBaum, zeichneCrumbs, aktuelleSeite, setzeSeite,
    kiPanel, suche, seitenSuche, theme, einstellungen, papierkorb, neueSeite,
    markdownExport, dupliziereSeite, seitenMenue, coverWaehlen,
    sicherungSpeichern, sicherungLaden, zurueck, vorwaerts
  };
})();

/* Los geht's */
window.addEventListener('DOMContentLoaded', () => App.start());
