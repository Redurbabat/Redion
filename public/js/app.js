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
  /** Auf dem Telefon werden aus Menüs Blätter, die von unten hochfahren. */
  const amTelefon = () => innerWidth <= 760;

  /**
   * @param opt { titel }  Überschrift des Blattes auf dem Telefon
   */
  const menu = (html, x, y, opt = {}) => {
    document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove());
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = html;

    if (amTelefon()) {
      /* Blatt von unten — genau wie in Notions Telefon-App */
      m.classList.add('blatt');
      m.innerHTML = '<div class="blatt-griff"></div>' +
        (opt.titel ? `<div class="blatt-titel">${opt.titel}</div>` : '') + html;
      const grund = document.createElement('div');
      grund.className = 'menu-grund';
      grund.addEventListener('click', () => { m.remove(); grund.remove(); });
      document.body.appendChild(grund);
      document.body.appendChild(m);
      /* Nach unten wischen schliesst es */
      let start = 0;
      m.addEventListener('touchstart', e => { start = e.touches[0].clientY; }, { passive: true });
      m.addEventListener('touchend', e => {
        const weg = e.changedTouches[0].clientY - start;
        if (weg > 90 && m.scrollTop <= 0) { m.remove(); grund.remove(); }
      });
      /* Einträge in Karten gruppieren — iOS-Art, wie in Notions App:
         was zwischen zwei Trennlinien steht, kommt in eine Karte. */
      const ziel = m.querySelector('.menu-liste') || m;
      const kinder = [...ziel.children];
      let karte = null;
      kinder.forEach(el => {
        if (el.tagName === 'HR') { karte = null; el.remove(); return; }
        if (el.classList.contains('grp') || el.classList.contains('menu-fuss') ||
            el.classList.contains('menu-suche') || el.classList.contains('av-karte') ||
            el.classList.contains('av-besch') || el.classList.contains('sp-kopf')) {
          karte = null; return;
        }
        if (!karte) {
          karte = document.createElement('div');
          karte.className = 'blatt-karte';
          ziel.insertBefore(karte, el);
        }
        karte.appendChild(el);
      });
      /* Löschen ist rot — genau wie bei Notion */
      m.querySelectorAll('[data-a="del"], [data-a="purge"]').forEach(x => x.classList.add('rot'));

      requestAnimationFrame(() => m.classList.add('auf'));
      return m;
    }

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

  /**
   * Ein Menü mit Suchfeld und Fusszeile — das Muster, das in Notion in
   * fast jedem grösseren Menü steckt („Aktionen filtern…", „Suchaktionen…").
   * Getippt wird sofort gefiltert; Pfeiltasten und Enter wählen aus.
   *
   * @param opt { platzhalter, fuss, kopf, breite }
   */
  const menuMitSuche = (html, x, y, opt = {}) => {
    const m = menu(
      (opt.kopf || '') +
      `<div class="menu-suche"><input placeholder="${opt.platzhalter || 'Filtern …'}" ` +
      'autocomplete="off" spellcheck="false"></div>' +
      '<div class="menu-liste">' + html + '</div>' +
      (opt.fuss ? '<div class="menu-fuss">' + opt.fuss + '</div>' : ''),
      x, y, { titel: opt.titel });
    if (opt.breite && !m.classList.contains('blatt')) m.style.width = opt.breite;

    const feld = m.querySelector('.menu-suche input');
    const liste = m.querySelector('.menu-liste');

    const sichtbare = () => [...liste.querySelectorAll('button')]
      .filter(b => b.offsetParent !== null || b.style.display !== 'none')
      .filter(b => b.style.display !== 'none' &&
                   (!b.parentElement.style.display || b.parentElement.style.display !== 'none'));

    const markiere = (b) => {
      liste.querySelectorAll('button.jetzt').forEach(x2 => x2.classList.remove('jetzt'));
      if (!b) return;
      b.classList.add('jetzt');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };

    /* Der Filter kennt die Form des Menüs nicht: Knöpfe können direkt
       darinliegen oder in einem Gitter stecken. Deshalb wird nach Knöpfen
       gesucht, nicht nach einer bestimmten Verschachtelung. */
    const filtern = () => {
      const q = feld.value.trim().toLowerCase();
      let gruppe = null, inGruppe = 0;

      const abschliessen = () => {
        if (gruppe && !inGruppe) gruppe.style.display = 'none';
      };

      [...liste.children].forEach(el => {
        if (el.classList.contains('grp')) {
          abschliessen();
          gruppe = el; inGruppe = 0;
          el.style.display = '';
          return;
        }
        if (el.tagName === 'HR') { el.style.display = q ? 'none' : ''; return; }

        const knoepfe = el.tagName === 'BUTTON' ? [el] : [...el.querySelectorAll('button')];
        if (!knoepfe.length) return;
        let sichtbar = 0;
        knoepfe.forEach(b => {
          const treffer = !q || b.textContent.toLowerCase().includes(q);
          b.style.display = treffer ? '' : 'none';
          if (treffer) sichtbar++;
        });
        if (el.tagName !== 'BUTTON') el.style.display = sichtbar ? '' : 'none';
        inGruppe += sichtbar;
      });
      abschliessen();

      markiere(sichtbare()[0]);
    };

    feld.addEventListener('input', filtern);
    feld.addEventListener('keydown', e => {
      const alle = sichtbare();
      const i = alle.findIndex(b => b.classList.contains('jetzt'));
      if (e.key === 'ArrowDown') { e.preventDefault(); markiere(alle[Math.min(i + 1, alle.length - 1)]); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); markiere(alle[Math.max(i - 1, 0)]); }
      if (e.key === 'Enter')     { e.preventDefault(); (alle[i] || alle[0])?.click(); }
      if (e.key === 'Escape')    { e.preventDefault(); m.remove(); }
    });
    liste.addEventListener('mousemove', e => {
      const b = e.target.closest('button');
      if (b && !b.classList.contains('jetzt')) markiere(b);
    });

    markiere(sichtbare()[0]);
    setTimeout(() => feld.focus(), 30);
    return m;
  };

  let toastTimer = null;
  /**
   * Eine kurze Meldung.
   * @param {string} text
   * @param {number} dauer  wie lange sie stehen bleibt — für laufende
   *                        Arbeiten (ein Upload) länger, sonst 2,6 Sekunden
   * @returns ein Griff mit setzen() und weg(), damit eine laufende Meldung
   *          sich fortschreiben lässt, statt zehnmal neu zu erscheinen
   */
  const toast = (text, dauer) => {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
    return {
      set textContent(v) { if (t.classList.contains('show')) t.textContent = v; },
      get textContent() { return t.textContent; },
      remove() { clearTimeout(toastTimer); t.classList.remove('show'); }
    };
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

  /** Ein Streifen oben, wenn etwas grundsätzlich klemmt. */
  const banner = (text, art = 'warn') => {
    document.getElementById('banner')?.remove();
    const d = document.createElement('div');
    d.id = 'banner';
    d.className = 'banner ' + art;
    d.innerHTML = `<span>${String(text)}</span><button title="Ausblenden">✕</button>`;
    d.querySelector('button').addEventListener('click', () => d.remove());
    document.body.appendChild(d);
    return d;
  };

  return { menu, menuMitSuche, toast, emojiWaehlen, frage, banner, amTelefon };
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

  /* ------------------------------------------------------------------------
   * Was zuletzt offen war — Notions „Kürzlich verwendet".
   * ----------------------------------------------------------------------*/
  const kuerzlichMerken = (id) => {
    const b = Store.getBlock(id);
    if (!b || b.type !== 'page' || b.parentTable === 'collection') return;
    const l = [id, ...(Store.getMeta('kuerzlich', []) || []).filter(x => x !== id)];
    Store.setMeta('kuerzlich', l.slice(0, 12));
  };

  const kuerzlich = () => (Store.getMeta('kuerzlich', []) || [])
    .map(id => Store.getBlock(id))
    .filter(b => b && b.alive && b.type === 'page' && b.parentTable !== 'collection')
    .slice(0, 6);

  /** Die nächsten Termine aus allen Termin-Datenbanken. */
  const kommendeTermine = (wieViele = 3) => {
    const raus = [];
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const grenze = new Date(heute); grenze.setDate(grenze.getDate() + 30);
    Object.values(Store.cache.collections).forEach(c => {
      const dk = Object.keys(c.schema || {}).find(k => c.schema[k].type === 'date');
      if (!dk) return;
      Store.rowsOf(c.id).forEach(r => {
        const v = Datenbank.wert(r, dk, c);
        if (!v) return;
        const d = new Date(v);
        if (isNaN(d) || d < heute || d > grenze) return;
        raus.push({ id: r.id, text: r.text || 'Ohne Titel', d,
                    wann: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) });
      });
    });
    return raus.sort((a, b) => a.d - b.d).slice(0, wieViele);
  };

  /* ========================================================================
   * SEITENLEISTE
   * ======================================================================*/
  /* --------------------------------------------------------------------- *
   * ABSCHNITTE DER SEITENLEISTE
   * Notion lässt jeden Abschnitt einzeln ausblenden („Abschnitte anpassen").
   * Hier steht, welche es gibt; was aus ist, merkt sich der Speicher.
   * --------------------------------------------------------------------- */
  const ABSCHNITTE = [
    ['werkzeuge', 'Werkzeuge'],
    ['agenten',   'Agenten'],
    ['bespr',     'Besprechungen'],
    ['kuerzlich', 'Kürzlich verwendet'],
    ['favoriten', 'Favoriten'],
    ['bereiche',  'Bereiche'],
    ['privat',    'Privat'],
    ['apps',      'Meine Apps']
  ];

  const abschnittAn = (id) => !(Store.getMeta('sidebarAus', []) || []).includes(id);

  /** Die Abschnitte in der selbst gewählten Reihenfolge. Notion lässt sie
      nur ein- und ausblenden, nicht umsortieren. */
  const abschnitteGeordnet = () => {
    const folge = Store.getMeta('sidebarFolge', null);
    if (!Array.isArray(folge) || !folge.length) return ABSCHNITTE;
    const nach = [];
    folge.forEach(id => { const a = ABSCHNITTE.find(x => x[0] === id); if (a) nach.push(a); });
    ABSCHNITTE.forEach(a => { if (!nach.includes(a)) nach.push(a); });
    return nach;
  };

  const abschnittSchieben = (id, richtung) => {
    const folge = abschnitteGeordnet().map(x => x[0]);
    const i = folge.indexOf(id);
    const j = i + richtung;
    if (i < 0 || j < 0 || j >= folge.length) return;
    [folge[i], folge[j]] = [folge[j], folge[i]];
    Store.setMeta('sidebarFolge', folge);
    zeichneBaum();
  };

  const abschnittSchalten = (id) => {
    const aus = Store.getMeta('sidebarAus', []) || [];
    Store.setMeta('sidebarAus', aus.includes(id) ? aus.filter(x => x !== id) : [...aus, id]);
    zeichneBaum();
  };

  let anpassModus = false;

  const abschnitteAnpassen = () => {
    anpassModus = !anpassModus;
    zeichneBaum();
  };

  const tabNamen = () => Store.getMeta('tabNamen', true) !== false;

  const zeichneReiter = () => {
    const leiste = document.getElementById('side-reiter');
    if (!leiste) return;
    leiste.classList.toggle('ohne-namen', !tabNamen());
    leiste.querySelectorAll('.sr').forEach(b => {
      b.classList.toggle('on', b.dataset.reiter === reiter);
    });
    /* Die untere Leiste am Telefon zeigt dieselben Bereiche — sie muss
       mitgehen, sonst stimmt an einem der beiden Orte die Markierung nicht. */
    if (typeof handyLeiste === 'function') handyLeiste();
  };

  let reiter = 'start';

  /**
   * Die untere Leiste am Telefon markieren und den Punkt am Posteingang
   * setzen. Wird bei jedem Wechsel und nach jedem Zeichnen aufgerufen —
   * eine Leiste, die nicht zeigt, wo man ist, ist nur eine Knopfreihe.
   */
  const handyLeiste = () => {
    const l = document.getElementById('handy-leiste');
    if (!l) return;
    const karte = { start: 'hl-start', chat: 'hl-chat', bespr: 'hl-bespr' };
    l.querySelectorAll('button[role="tab"]').forEach(b => b.classList.remove('an'));
    const aktiv = document.getElementById(karte[reiter] || 'hl-start');
    if (aktiv) aktiv.classList.add('an');
    /* Ein Punkt, wenn im Posteingang etwas Ungelesenes liegt */
    const punkt = l.querySelector('.hl-punkt');
    if (punkt) {
      let offen = 0;
      try { offen = (Werkzeuge.meldungen ? Werkzeuge.meldungen() : [])
                      .filter(m => !m.gelesen).length; } catch {}
      punkt.hidden = !offen;
    }
  };

  const reiterWechseln = (id) => {
    reiter = id;
    zeichneReiter();
    if (id === 'suche') { suche(); reiter = 'start'; zeichneReiter(); return; }
    if (id === 'inbox') { Ansichten.posteingang(); reiter = 'start'; zeichneReiter(); zeichneBaum(); return; }
    zeichneBaum();
  };

  const zeichneBaum = () => {
    const baum = document.getElementById('tree');
    baum.innerHTML = '';
    zeichneReiter();

    /* Der Chat-Reiter ersetzt den Baum durch Agenten und Verlauf */
    if (reiter === 'chat')  { KI.seitenleiste(baum); return; }
    if (reiter === 'bespr') { Meeting.seitenleiste(baum); return; }

    /* Anpassmodus: jeder Abschnitt bekommt ein Auge */
    if (anpassModus) {
      const kopf = document.createElement('div');
      kopf.className = 'side-section';
      kopf.innerHTML = '<span>Abschnitte anpassen</span>';
      baum.appendChild(kopf);
      const geordnet = abschnitteGeordnet();
      geordnet.forEach(([id, name], nr) => {
        const z = document.createElement('button');
        z.className = 'side-item anpass' + (abschnittAn(id) ? '' : ' aus');
        z.innerHTML = `<span>${abschnittAn(id) ? '👁' : '🚫'}</span><span>${name}</span>` +
          '<span class="anpass-pfeile">' +
            (nr > 0 ? '<i data-hoch="1" title="nach oben">⌃</i>' : '') +
            (nr < geordnet.length - 1 ? '<i data-runter="1" title="nach unten">⌄</i>' : '') +
          '</span>';
        z.addEventListener('click', (ev) => {
          if (ev.target.closest('[data-hoch]'))   { ev.stopPropagation(); abschnittSchieben(id, -1); return; }
          if (ev.target.closest('[data-runter]')) { ev.stopPropagation(); abschnittSchieben(id, 1); return; }
          abschnittSchalten(id);
        });
        baum.appendChild(z);
      });
      const zurueck = document.createElement('button');
      zurueck.className = 'side-item anpass';
      zurueck.innerHTML = '<span>↺</span><span>Reihenfolge zurücksetzen</span>';
      zurueck.addEventListener('click', () => {
        Store.setMeta('sidebarFolge', null);
        zeichneBaum();
        UI.toast('Reihenfolge zurückgesetzt');
      });
      baum.appendChild(zurueck);
      const nam = document.createElement('button');
      nam.className = 'side-item anpass';
      nam.innerHTML = `<span>🏷</span><span>Tab-Namen ${tabNamen() ? 'ausblenden' : 'einblenden'}</span>`;
      nam.addEventListener('click', () => {
        Store.setMeta('tabNamen', !tabNamen());
        zeichneBaum();
      });
      baum.appendChild(nam);

      const fertig = document.createElement('button');
      fertig.className = 'anpass-fertig';
      fertig.textContent = 'Erledigt';
      fertig.addEventListener('click', () => { anpassModus = false; zeichneBaum(); });
      baum.appendChild(fertig);
      return;
    }

    /* Werkzeuge — die Funktionen der anderen Programme haben hier ihren Ort */
    if (abschnittAn('werkzeuge')) {
    const wz = document.createElement('div');
    wz.className = 'wz-block';
    wz.innerHTML = [
      ['journal', '📅', 'Journal', 'Tageseintrag — Strg Shift J'],
      ['memos',   '⚡', 'Schnellnotizen', 'Kurze Gedanken — Strg Shift M'],
      ['vorlagen','🧩', 'Vorlagen', 'Fertige Aufbauten und eigene Vorlagen'],
      ['graph',   '🕸', 'Graph', 'Wie alles zusammenhängt — Strg Shift G'],
      ['tags',    '🏷', 'Schlagwörter', 'Alle #Schlagwörter — Strg Shift T'],
      ['lernen',  '🎴', 'Karteikarten', 'Wiederholen nach Plan'],
      ['stand',   '✅', 'Umsetzungsstand', 'Alle 16 Teile der Notion-Doku, Punkt für Punkt']
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
      if (a === 'stand') Status.seiteAnlegen();
    });
    baum.appendChild(abschnitt('Werkzeuge'));
    baum.appendChild(wz);

    const faellig = Werkzeuge.faellig().length;
    const lz = wz.querySelector('#lz');
    if (lz && faellig) lz.textContent = faellig;
    }

    /* Agenten — wie in Notions Seitenleiste */
    if (abschnittAn('agenten')) {
    const agenten = Agent.eigene();
    baum.appendChild(abschnitt('Agenten', () => Agent.eigenerDialog()));
    const ag = document.createElement('div');
    ag.className = 'wz-block';
    ag.innerHTML = agenten.slice(0, 6).map(a =>
      `<button class="side-item" data-agent="${esc(a.id)}"><span>${a.icon || '🤖'}</span>` +
      `<span>${esc(a.name)}</span></button>`).join('') +
      '<button class="side-item" data-agent="+"><span>＋</span><span>Neuer Agent</span></button>';
    ag.addEventListener('click', e => {
      const b = e.target.closest('[data-agent]');
      if (!b) return;
      if (b.dataset.agent === '+') Agent.eigenerDialog();
      else Agent.panel('');
    });
    baum.appendChild(ag);
    }

    /* Besprechungen */
    if (abschnittAn('bespr')) {
    const bes = document.createElement('div');
    bes.className = 'wz-block';
    const naechste = kommendeTermine(3);
    bes.innerHTML =
      (naechste.length
        ? naechste.map(t => `<button class="side-item" data-termin="${t.id}">` +
            `<span>📌</span><span>${esc(t.text)}</span>` +
            `<span class="k">${esc(t.wann)}</span></button>`).join('')
        : '<div class="side-leer">Keine bevorstehenden Ereignisse</div>') +
      '<button class="side-item" data-bes="neu"><span>🎙</span><span>Neue Besprechungsnotiz</span></button>';
    bes.addEventListener('click', e => {
      const t = e.target.closest('[data-termin]');
      if (t) { oeffne(t.dataset.termin); return; }
      if (e.target.closest('[data-bes="neu"]')) Meeting.panel();
    });
    baum.appendChild(abschnitt('Besprechungen'));
    baum.appendChild(bes);
    }

    /* Kürzlich verwendet */
    const letzte = abschnittAn('kuerzlich') ? kuerzlich() : [];
    if (letzte.length) {
      baum.appendChild(abschnitt('Kürzlich verwendet'));
      const kv = document.createElement('div');
      kv.className = 'wz-block';
      kv.innerHTML = letzte.map(p2 =>
        `<button class="side-item" data-kv="${p2.id}"><span>${p2.icon || '📄'}</span>` +
        `<span>${esc(p2.text || 'Ohne Titel')}</span></button>`).join('');
      kv.addEventListener('click', e => {
        const b = e.target.closest('[data-kv]');
        if (b) oeffne(b.dataset.kv);
      });
      baum.appendChild(kv);
    }

    /* Favoriten */
    const favs = abschnittAn('favoriten') ? Store.favorites() : [];
    if (favs.length) {
      baum.appendChild(abschnitt('Favoriten'));
      favs.forEach(p => baum.appendChild(zeile(p, 0)));
    }

    /* Bereiche (bei Notion: Teamspaces) */
    const bereiche = abschnittAn('bereiche') ? (Store.getMeta('bereiche', []) || []) : [];
    bereiche.forEach(b => {
      const drin = Store.rootPages().filter(p => p.bereich === b.id && !p.system && !p.archiviert);
      baum.appendChild(abschnitt(b.icon + ' ' + b.name, () => {
        const p = Store.addPage(null, { text: '', bereich: b.id });
        zeichneBaum(); oeffne(p.id);
        setTimeout(() => document.getElementById('title')?.focus(), 60);
      }));
      if (!drin.length) {
        const leer = document.createElement('div');
        leer.style.cssText = 'padding:6px 14px; font-size:12.5px; color:var(--text-faint)';
        leer.textContent = 'Noch leer';
        baum.appendChild(leer);
      }
      drin.forEach(p => baum.appendChild(zeile(p, 0)));
    });

    /* Privat */
    if (abschnittAn('privat')) {
    const kopf = abschnitt('Privat', () => {
      const p = Store.addPage(null, { text: '' });
      zeichneBaum();
      oeffne(p.id);
      setTimeout(() => document.getElementById('title')?.focus(), 60);
    });
    baum.appendChild(kopf);

    const seiten = Store.rootPages().filter(p => !p.system && !p.bereich && !p.archiviert);
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
    }

    /* Meine Apps — bei Notion steht hier „Notion-Apps" ganz unten */
    if (!abschnittAn('apps')) return;
    baum.appendChild(abschnitt('Meine Apps', null, () => abschnitteAnpassen()));
    const apps = document.createElement('div');
    apps.className = 'wz-block apps-block';
    apps.innerHTML = [
      ['kalender',  '📅', 'Kalender',       'Termine aus allen Quellen'],
      ['pwa',       '📱', 'App installieren','Auf dem Telefon oder Rechner ablegen'],
      ['bib',       '📚', 'Bibliothek',     'Alle Seiten, sortierbar'],
      ['aufgaben',  '☑',  'Meine Aufgaben', 'Was dir zugewiesen ist'],
      ['markt',     '🛍', 'Marktplatz',     'Fertige Vorlagen'],
      ['wissen',    '📖', 'Notion-Wissen',  'Alles über Notion und Redion, in acht Teilen'],
      ['pflege',    '🧰', 'Erste Hilfe',    'Prüfen, reparieren, sichern'],
      ['modell',    '🗺', 'Datenmodell',    'Alle Datenbanken und ihre Verknüpfungen'],
      ['kennzahl',  '📊', 'Kennzahlen',     'Zahlen aus mehreren Datenbanken'],
      ['krypto',    '🔐', 'Passwort',       'Verschlüsselte Sicherung und Sperre'],
      ['aussehen',  '🎨', 'Aussehen',       'Farben, Schrift und Tastenkürzel'],
      ['tempo',     '⏱', 'Tempo',          'Wie schnell gezeichnet und gerechnet wird'],
      ['kann',      '⭐', 'Was Redion kann','Alles auf einen Blick, mit Führung'],
      ['erweitern', '🧩', 'Erweiterungen',  'Eigene Befehle, Knöpfe und Formeln'],
      ['eingang',   '📨', 'Was hereinkommt','Daten von aussen abholen und einwerfen'],
      ['tagesplan', '☀',  'Tagesplan',      'Was heute ansteht'],
      ['woche',     '📅', 'Wochenrückblick','Was lief, was blieb liegen'],
      ['spaeter',   '⏰', 'Zurückgestellt', 'Was später wieder hochkommt'],
      ['hilfe',     '？', 'Hilfe',          'Tastenkürzel — Strg /'],
      ['papier',    '🗑', 'Papierkorb',     'Gelöschte Seiten']
    ].map(([a, i, n, t]) =>
      `<button class="side-item" data-app="${a}" title="${t}"><span>${i}</span><span>${n}</span></button>`
    ).join('');
    /* Zugeklappte Abschnitte: alles bis zur nächsten Überschrift verstecken */
    setTimeout(() => {
      let versteckt = false;
      [...baum.children].forEach(el => {
        if (el.classList.contains('side-section')) {
          versteckt = abschnittZu(el.querySelector('span')?.firstChild?.textContent || '');
          el.classList.toggle('zu', versteckt);
          return;
        }
        el.style.display = versteckt ? 'none' : '';
      });
    }, 0);

    apps.addEventListener('click', e => {
      const b = e.target.closest('[data-app]');
      if (!b) return;
      const a = b.dataset.app;
      if (a === 'kalender') Kalender.dialog();
      if (a === 'pwa')      PWA.installieren();
      if (a === 'bib')      Bibliothek.oeffne();
      if (a === 'aufgaben') Bibliothek.aufgaben();
      if (a === 'markt')    Werkzeuge.vorlagen();
      if (a === 'wissen')   Wissen.oeffnen();
      if (a === 'pflege')   Pflege.ersteHilfe();
      if (a === 'modell')   Schema.ansicht();
      if (a === 'kennzahl') Schema.tafel();
      if (a === 'krypto')   Krypto.dialog();
      if (a === 'aussehen') Aussehen.dialog();
      if (a === 'tempo')    Tempo.dialog();
      if (a === 'kann')      Rundgang.uebersicht();
      if (a === 'erweitern') Erweiterung.dialog();
      if (a === 'eingang')   Eingang.dialog();
      if (a === 'tagesplan') Plan.tagesplan();
      if (a === 'woche')     Plan.wochenrueckblick();
      if (a === 'spaeter')   Plan.uebersicht();
      if (a === 'hilfe')    Werkzeuge.tastenkuerzel();
      if (a === 'papier')   papierkorb();
    });
    baum.appendChild(apps);
    /* Die selbst gewählte Reihenfolge der Abschnitte anwenden */
    abschnitteOrdnen(baum);
    /* Erweiterungsknöpfe wieder anhängen — zeichneBaum leert den Baum */
    if (window.Erweiterung && Erweiterung.knoepfeAnhaengen) Erweiterung.knoepfeAnhaengen();
  };

  /**
   * Ordnet die fertig gezeichneten Abschnitte um.
   * Ein Abschnitt ist seine Überschrift plus alles bis zur nächsten. Was vor
   * der ersten Überschrift steht, gehört zu „Werkzeuge".
   */
  const abschnitteOrdnen = (baum) => {
    const folge = Store.getMeta('sidebarFolge', null);
    if (!Array.isArray(folge) || !folge.length) return;

    const nachName = {};
    ABSCHNITTE.forEach(([id, name]) => { nachName[name] = id; });

    const teile = [];
    let jetzt = { id: 'werkzeuge', nodes: [] };
    [...baum.children].forEach(el => {
      if (el.classList.contains('side-section')) {
        const name = (el.querySelector('span')?.firstChild?.textContent || '').trim();
        if (jetzt.nodes.length) teile.push(jetzt);
        jetzt = { id: nachName[name] || ('x-' + name), nodes: [el] };
        return;
      }
      jetzt.nodes.push(el);
    });
    if (jetzt.nodes.length) teile.push(jetzt);
    if (teile.length < 2) return;

    const rang = (id) => {
      const i = folge.indexOf(id);
      return i < 0 ? 500 : i;
    };
    teile.sort((a, b) => rang(a.id) - rang(b.id));
    teile.forEach(t => t.nodes.forEach(n => baum.appendChild(n)));
  };

  /** Welche Abschnitte sind zugeklappt? Notion merkt sich das je Abschnitt. */
  const abschnittZu = (name) => (Store.getMeta('sidebarZu', []) || []).includes(name);

  const abschnittKlappen = (name) => {
    const zu = Store.getMeta('sidebarZu', []) || [];
    Store.setMeta('sidebarZu', zu.includes(name) ? zu.filter(x => x !== name) : [...zu, name]);
    zeichneBaum();
  };

  /** Vom sichtbaren Namen zurück auf den Schlüssel in ABSCHNITTE. */
  const abschnittId = (name) => (ABSCHNITTE.find(([, n]) => n === name) || [])[0] || null;

  /**
   * Das ⋯-Menü eines Abschnitts. Was hier steht, muss auch etwas tun —
   * ein Menüpunkt, der nur da ist, damit es ihn gibt, ist schlimmer als
   * gar keiner.
   */
  const abschnittMenue = (anker, name) => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const id = abschnittId(name);
    const zu = abschnittZu(name);
    const folge = abschnitteGeordnet().map(x => x[0]);
    const i = id ? folge.indexOf(id) : -1;

    const r = anker.getBoundingClientRect();
    const m = document.createElement('div');
    m.className = 'menu';
    m.style.cssText = `position:fixed; left:${Math.min(r.left, innerWidth - 230)}px; ` +
                      `top:${r.bottom + 4}px; z-index:1400; min-width:210px`;
    m.innerHTML =
      `<button data-a="klappen"><span class="mi">${zu ? '⌄' : '›'}</span>` +
        `${zu ? 'Aufklappen' : 'Zuklappen'}</button>` +
      '<button data-a="alleZu"><span class="mi">⌃</span>Alle Abschnitte zuklappen</button>' +
      '<button data-a="alleAuf"><span class="mi">⌄</span>Alle aufklappen</button>' +
      (id ? '<hr>' +
        `<button data-a="hoch"${i <= 0 ? ' disabled' : ''}><span class="mi">↑</span>Weiter nach oben</button>` +
        `<button data-a="runter"${i < 0 || i >= folge.length - 1 ? ' disabled' : ''}>` +
          '<span class="mi">↓</span>Weiter nach unten</button>' +
        '<button data-a="aus"><span class="mi">🚫</span>Diesen Abschnitt ausblenden</button>' : '') +
      '<hr>' +
      '<button data-a="anpassen"><span class="mi">⚙</span>Abschnitte anpassen</button>';
    document.body.appendChild(m);

    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b || b.disabled) return;
      const a = b.dataset.a;
      m.remove();
      if (a === 'klappen') abschnittKlappen(name);
      if (a === 'alleZu')  { Store.setMeta('sidebarZu', ABSCHNITTE.map(x => x[1])); zeichneBaum(); }
      if (a === 'alleAuf') { Store.setMeta('sidebarZu', []); zeichneBaum(); }
      if (a === 'hoch')    abschnittSchieben(id, -1);
      if (a === 'runter')  abschnittSchieben(id, 1);
      if (a === 'aus')     { abschnittSchalten(id); UI.toast(name + ' ausgeblendet'); }
      if (a === 'anpassen') abschnitteAnpassen();
    });
    setTimeout(() => document.addEventListener('click',
      () => m.remove(), { once: true }), 0);
  };

  const abschnitt = (name, beiPlus, beiZahnrad) => {
    const d = document.createElement('div');
    d.className = 'side-section';
    /* Chevron zum Auf- und Zuklappen — wie in Notions Telefon-App */
    d.innerHTML = `<span>${name}<i class="ss-pfeil">${abschnittZu(name) ? '›' : '⌄'}</i></span>`;
    d.querySelector('span').addEventListener('click', () => abschnittKlappen(name));
    if (beiZahnrad) {
      const z = document.createElement('button');
      z.textContent = '⚙';
      z.title = 'Abschnitte anpassen';
      z.addEventListener('click', beiZahnrad);
      d.appendChild(z);
    }
    if (beiPlus) {
      const b = document.createElement('button');
      b.textContent = '+';
      b.title = 'Neue Seite';
      b.addEventListener('click', beiPlus);
      d.appendChild(b);
    }
    /* --- Das Drei-Punkte-Menü des Abschnitts -------------------------
     * Bisher gab es zum Abschnitt nur den Pfeil und das Plus; alles
     * andere — ausblenden, umsortieren — lag im Anpassmodus versteckt.
     * Notion hat an jedem Abschnitt ein eigenes ⋯. Das holt es nach und
     * legt gleich das dazu, was hier wirklich nützlich ist: alles
     * zuklappen, und ein Weg zur Anpassliste.
     * ---------------------------------------------------------------- */
    const punkte = document.createElement('button');
    punkte.textContent = '⋯';
    punkte.title = 'Mehr zu diesem Abschnitt';
    punkte.addEventListener('click', (e) => {
      e.stopPropagation();
      abschnittMenue(punkte, name);
    });
    d.appendChild(punkte);
    return d;
  };

  const zeile = (p, tiefe) => {
    const w = document.createElement('div');
    const r = document.createElement('div');
    r.className = 'row' + (p.id === seiteId ? ' on' : '');
    r.draggable = true;

    const kinder = Store.childrenOf(p.id).filter(k => k.type === 'page' && !k.archiviert);
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
  /** Wie viele Wörter stehen auf der Seite? Notion zeigt das im Seitenmenü. */
  const woerterZaehlen = (seiteId) => {
    let n = 0;
    const zaehle = (id, tiefe) => {
      if (tiefe > 4) return;
      Store.childrenOf(id).forEach(b => {
        if (b.type === 'page') return;
        if (b.text) n += b.text.trim().split(/\s+/).filter(Boolean).length;
        if (Array.isArray(b.rows)) n += b.rows.flat().join(' ').split(/\s+/).filter(Boolean).length;
        zaehle(b.id, tiefe + 1);
      });
    };
    zaehle(seiteId, 0);
    return n;
  };

  /* ------------------------------------------------------------------ *
   * ÜBERSETZEN, VORSCHLÄGE, BENACHRICHTIGUNGEN, VERBINDUNGEN
   * Vier Einträge, die es bei Notion im Seitenmenü gibt.
   * ------------------------------------------------------------------ */

  const SPRACHEN = [
    ['Deutsch', 'Deutsch'], ['Englisch', 'English'], ['Französisch', 'Français'],
    ['Italienisch', 'Italiano'], ['Spanisch', 'Español'], ['Portugiesisch', 'Português'],
    ['Niederländisch', 'Nederlands'], ['Polnisch', 'Polski'], ['Türkisch', 'Türkçe'],
    ['Russisch', 'Русский'], ['Japanisch', '日本語'], ['Koreanisch', '한국어'],
    ['Chinesisch (vereinfacht)', '简体中文']
  ];

  /* Notion kennt genau zwei Stufen, nicht drei. */
  const BENACHRICHTIGUNG = { alle: 'Kommentare', erwaehnungen: 'Erwähnungen' };

  /** Eine Menüzeile mit echtem Schalter rechts — so macht es Notion. */
  const schalterZeile = (a, icon, text, an) =>
    `<button data-a="${a}" class="mit-schalter"><span class="mi">${icon}</span>${text}` +
    `<span class="mschalter${an ? ' an' : ''}"><i></i></span></button>`;

  /**
   * „Mit KI verwenden" — bei Notion macht dieser Eintrag aus der Seite
   * selbst etwas für die KI: eine Fähigkeit, eine dauerhafte Anweisung
   * oder die Anweisung für Besprechungsnotizen. Darunter stehen bei uns
   * zusätzlich die Schreibbefehle.
   */
  const mitKiMenue = (anker, p) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<button data-k="faehig"><span class="mi">🧩</span>Als KI-Fähigkeit verwenden' +
        '<span class="sub">Der Seiteninhalt wird zur Anweisung, aufrufbar mit @</span></button>' +
      '<button data-k="anweisung"><span class="mi">📌</span>Als KI-Anweisung verwenden' +
        '<span class="sub">Gilt dann für jede Antwort</span></button>' +
      '<button data-k="meeting"><span class="mi">🎙</span>Als KI-Meeting-Anweisung verwenden' +
        '<span class="sub">Nur beim Auswerten von Besprechungen</span></button>' +
      '<hr>' +
      '<button data-k="schreiben"><span class="mi">✒️</span>Schreiben und bearbeiten …</button>',
      r.right + 4, r.top);

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      m.remove();
      const inhalt = markdownVonSeite(p).trim();
      if (b.dataset.k !== 'schreiben' && !inhalt) {
        UI.toast('Diese Seite ist leer — sie kann noch keine Anweisung sein');
        return;
      }
      if (b.dataset.k === 'faehig') {
        const name = await UI.frage('Wie soll die Fähigkeit heissen?', p.text || 'Neue Fähigkeit');
        if (!name) return;
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
      if (b.dataset.k === 'schreiben') KI.schreibMenue(anker);
    });
  };

  const uebersetzenMenue = (anker, p) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menuMitSuche(
      SPRACHEN.map(([de, eigen]) =>
        `<button data-s="${esc(de)}">${esc(de)}<span class="ms">${esc(eigen)}</span></button>`).join(''),
      r.right + 4, r.top,
      { platzhalter: 'Sprache suchen …',
        kopf: '<div class="grp">Übersetzen</div>',
        fuss: 'Übersetzt wird mit dem Modell, das unter <b>Einstellungen → KI</b> eingestellt ist.' });

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-s]');
      if (!b) return;
      const ziel = b.dataset.s;
      m.remove();

      const text = markdownVonSeite(p);
      if (!text.trim()) { UI.toast('Diese Seite ist leer'); return; }
      UI.toast('Übersetze nach ' + ziel + ' …');
      try {
        const antwort = await KI.frageKurz(
          `Übersetze den folgenden Text nach ${ziel}. Behalte die Markdown-Struktur ` +
          '(Überschriften, Listen, Zitate) genau bei. Gib nur die Übersetzung aus, ' +
          'ohne Vorrede.\n\n' + text);
        if (!antwort) { UI.toast('Keine Antwort erhalten'); return; }
        const neu = Store.addPage(p.parentId || null, {
          text: (p.text || 'Ohne Titel') + ' — ' + ziel, icon: '🅰'
        });
        Werkzeuge.ausMarkdown(neu, antwort);
        zeichneBaum(); oeffne(neu.id);
        UI.toast('Übersetzung als neue Seite angelegt');
      } catch (err) {
        UI.toast('Übersetzen ging nicht: ' + (err.message || err));
      }
    });
  };

  /**
   * Vorschlagsmodus. Solange er an ist, wird jede Textänderung als Vorschlag
   * festgehalten statt einfach übernommen — mit Balken zum Annehmen oder
   * Verwerfen, wie bei Notion.
   */
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
        if (e.target.dataset.a === 'zeigen') vorschlaegeZeigen(Store.getBlock(p.id));
        if (e.target.dataset.a === 'ende') {
          Store.updateBlock(p.id, { vorschlagModus: false });
          b.remove(); zeichneSeite();
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
            ? liste.map((v, i) =>
                '<div class="vor-eintrag">' +
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
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const ok = e.target.closest('[data-ok]'), weg = e.target.closest('[data-weg]');
      if (!ok && !weg) return;
      const i = +(ok || weg).dataset[ok ? 'ok' : 'weg'];
      const v = (p.vorschlaege || [])[i];
      if (!v) return;
      if (weg && Store.getBlock(v.bid)) Store.updateBlock(v.bid, { text: v.alt });
      const rest = (p.vorschlaege || []).filter((_, j) => j !== i);
      Store.updateBlock(p.id, { vorschlaege: rest });
      o.remove(); zeichneSeite(); vorschlaegeZeigen(Store.getBlock(p.id));
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
          '<div style="margin-top:12px"><button data-a="verl" class="prim">Versionsverlauf öffnen</button></div>' +
        '</div>' +
        '<div class="hint">Alle Zahlen stammen aus diesem Gerät — es wird nichts gemeldet.</div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="verl"]')) { o.remove(); Werkzeuge.versionen(p); }
    });
  };

  const benachrichtigungMenue = (anker, p) => {
    const r = anker.getBoundingClientRect();
    const jetzt = p.benachrichtigung || 'alle';
    const m = UI.menu(
      `<button data-b="alle">Alle Kommentare${jetzt === 'alle' ? '<span class="ms">✓</span>' : ''}</button>` +
      '<button data-b="erwaehnungen">Antworten und @-Erwähnungen' +
        (jetzt === 'erwaehnungen' ? '<span class="ms">✓</span>' : '') + '</button>' +
      '<div class="menu-fuss">Gilt für diese Seite und alle Unterseiten.</div>',
      r.right + 4, r.top);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-b]');
      if (!b) return;
      Store.updateBlock(p.id, { benachrichtigung: b.dataset.b });
      m.remove();
      UI.toast('Benachrichtigungen: ' + BENACHRICHTIGUNG[b.dataset.b]);
    });
  };

  const verbindungenMenue = (anker, p) => {
    const r = anker.getBoundingClientRect();
    const dienste = Verbindungen.DIENSTE || [];
    const zst = Verbindungen.zustand();
    const drin = p.verbindungen || [];
    const m = UI.menu('<div class="grp">Verbindungen</div>' +
      (dienste.length
        ? dienste.map(d =>
            `<button data-v="${d.id}"><span class="mi">${d.icon || '⊞'}</span>${esc(d.name || d.id)}` +
            `<span class="ms">${drin.includes(d.id) ? 'verknüpft'
              : ((zst[d.id] || {}).verbunden ? 'bereit' : 'aus')}</span></button>`).join('')
        : '<div class="menu-fuss">Keine</div>') +
      '<hr><button data-v="__einst"><span class="mi">⚙</span>Verbindungen einrichten …</button>',
      r.right + 4, r.top);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      m.remove();
      if (b.dataset.v === '__einst') { einstellungen('verbindungen'); return; }
      const id = b.dataset.v;
      const neu = drin.includes(id) ? drin.filter(x => x !== id) : [...drin, id];
      Store.updateBlock(p.id, { verbindungen: neu });
      const name = (dienste.find(d => d.id === id) || {}).name || id;
      UI.toast(neu.includes(id) ? 'Seite mit ' + name + ' verknüpft' : 'Verknüpfung zu ' + name + ' gelöst');
    });
  };

  const seitenMenue = (anker, p) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menuMitSuche(
      /* Darstellung */
      '<div class="schrift-kacheln">' +
        [['default','Ag','Standard'],['serif','Ag','Serife'],['mono','Ag','Mono']]
          .map(([id, ag, n]) =>
            `<button data-schrift="${id}" class="${(p.font || 'default') === id ? 'on' : ''}">` +
            `<b class="sk-${id}">${ag}</b><span>${n}</span></button>`).join('') +
      '</div>' +
      /* Seitenaktionen — Reihenfolge wie in Notions Menü */
      '<button data-a="link"><span class="mi">🔗</span>Link kopieren<span class="ms">Strg Alt L</span></button>' +
      '<button data-a="inhalt"><span class="mi">📋</span>Seiteninhalte kopieren</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren<span class="ms">Strg D</span></button>' +
      '<button data-a="wz-verschieben"><span class="mi">➦</span>Verschieben nach<span class="ms">Strg ⇧ P</span></button>' +
      `<button data-a="archiv"><span class="mi">🗄</span>${p.archiviert ? 'Aus dem Archiv holen' : 'Archivieren'}</button>` +
      '<button data-a="del"><span class="mi">🗑</span>In den Papierkorb verschieben<span class="ms">Entf</span></button>' +
      '<hr>' +
      '<button data-a="wz-praesi"><span class="mi">▶</span>Präsentieren' +
        '<span class="kenn">Beta</span><span class="ms">Strg Alt P</span></button>' +
      schalterZeile('klein', '↕', 'Kleiner Text', p.small) +
      schalterZeile('breit', '↔', 'Volle Breite', p.wide) +
      schalterZeile('pfad', '🗂', 'Pfadnavigation anzeigen', p.pfad !== false) +
      '<button data-a="anpassen"><span class="mi">⚙</span>Seite anpassen<span class="ms">▸</span></button>' +
      '<hr>' +
      '<button data-a="offline"><span class="mi">⭳</span>Offline verfügbar' +
        '<span class="ms">immer</span></button>' +
      '<hr>' +
      schalterZeile('wz-gesperrt', '🔒', 'Seite sperren', p.gesperrt) +
      '<button data-a="mitki"><span class="mi">✨</span>Mit KI verwenden<span class="ms">▸</span></button>' +
      '<hr>' +
      /* Auf dem Telefon ist die Kopfzeile schmal wie in Notion: nur ☰, ‹,
         Titel und ⋯. Alles andere steht hier, sonst wäre es unerreichbar. */
      (UI.amTelefon()
        ? '<button data-a="teilen"><span class="mi">↗</span>Teilen und ausgeben</button>' +
          '<button data-a="verlauf"><span class="mi">🕘</span>Versionsverlauf</button>' +
          '<button data-a="kopf-komm"><span class="mi">💬</span>Kommentare</button>' +
          '<button data-a="auto"><span class="mi">⚡</span>Automationen</button><hr>'
        : '') +
      `<button data-a="fav"><span class="mi">${p.favorite ? '★' : '☆'}</span>` +
      `${p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}</button>` +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="icon"><span class="mi">😀</span>Symbol ändern</button>' +
      '<button data-a="cover"><span class="mi">🖼</span>Cover ändern</button>' +
      '<button data-a="pid"><span class="mi">#</span>Seiten-ID kopieren</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentare</button>' +
      `<button data-a="vorschlag"><span class="mi">✍</span>Änderungen vorschlagen` +
        `<span class="ms">${p.vorschlagModus ? 'an' : 'aus'}</span></button>` +
      ((p.vorschlaege || []).length
        ? `<button data-a="vorschlaege"><span class="mi">📝</span>Vorschläge ansehen` +
          `<span class="ms">${p.vorschlaege.length}</span></button>` : '') +
      '<button data-a="uebersetzen"><span class="mi">🅰</span>Übersetzen<span class="ms">▸</span></button>' +
      '<button data-a="undo"><span class="mi">↶</span>Rückgängig machen<span class="ms">Strg Z</span></button>' +
      '<hr>' +
      /* Daten */
      '<button data-a="export"><span class="mi">⭳</span>Als Markdown</button>' +
      '<button data-a="import"><span class="mi">⭱</span>Markdown einlesen</button>' +
      Werkzeuge.seitenMenueZusatz(p) +
      '<hr>' +
      `<button data-a="stat2"><span class="mi">📈</span>Seitenaufrufe<span class="ms">${p.aufrufe || 0}</span></button>` +
      '<button data-a="updates"><span class="mi">🕘</span>Updates und Analysen</button>' +
      `<button data-a="benach"><span class="mi">🔔</span>Benachrichtigungen` +
        `<span class="ms">${BENACHRICHTIGUNG[p.benachrichtigung || 'alle']} ▸</span></button>` +
      `<button data-a="verbind"><span class="mi">⊞</span>Verbindungen` +
        `<span class="ms">${(p.verbindungen || []).length || 'Keine'} ▸</span></button>` +
      '<button data-a="papier"><span class="mi">🗑</span>Gelöschte Seiten</button>',
      r.right + 4, r.top,
      { platzhalter: 'Suchaktionen …', titel: 'Aktionen',
        fuss: `Wortzahl: <b>${woerterZaehlen(p.id)}</b> Wörter<br>` +
              `Zuletzt bearbeitet von <b>${esc(p.geaendertVon || p.erstelltVon || 'dir')}</b><br>` +
              esc(Einstellungen.datum(new Date(p.edited || p.created), true)) });

    m.addEventListener('click', async e => {
      /* Nur die Schriftkacheln im Menü, nicht der <body> — der trägt
         ebenfalls ein data-schrift für die Schriftgrösse. Ohne die
         Einschränkung auf button fing dieser Zweig jeden Klick ab. */
      const sk = e.target.closest('button[data-schrift]');
      if (sk) {
        Store.updateBlock(p.id, { font: sk.dataset.schrift });
        m.querySelectorAll('[data-schrift]').forEach(x => x.classList.remove('on'));
        sk.classList.add('on');
        zeichneSeite();
        return;
      }
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
      if (a === 'inhalt') {
        const text = markdownVonSeite(p);
        navigator.clipboard?.writeText(text);
        UI.toast('Seiteninhalte kopiert — ' + text.split('\n').length + ' Zeilen');
        m.remove();
        return;
      }
      if (a === 'offline') {
        UI.toast('Alles liegt ohnehin auf diesem Gerät — auch ohne Netz.');
        return;
      }

      /* Schalter bleiben im Menü stehen und kippen an Ort und Stelle */
      if (a === 'klein' || a === 'breit' || a === 'wz-gesperrt' || a === 'pfad') {
        const feld = a === 'klein' ? 'small' : a === 'breit' ? 'wide'
                   : a === 'pfad' ? 'pfad' : 'gesperrt';
        const neu = a === 'pfad' ? !(p.pfad !== false) : !p[feld];
        Store.updateBlock(p.id, { [feld]: neu });
        p[feld] = neu;
        b.querySelector('.mschalter')?.classList.toggle('an', neu);
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
        } else zeichneSeite();
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

      /* Die vier, die auf dem Telefon aus der Kopfzeile hierher gewandert sind */
      if (a === 'teilen')    { Werkzeuge.teilenMenue(anker, p); return; }
      if (a === 'verlauf')   { Werkzeuge.versionen(p); return; }
      if (a === 'kopf-komm') { document.getElementById('btn-komm')?.click(); return; }
      if (a === 'auto')      { document.getElementById('btn-auto')?.click(); return; }
      if (a === 'fav')   { Store.updateBlock(p.id, { favorite: !p.favorite }); zeichneBaum(); }
      if (a === 'klein') { Store.updateBlock(p.id, { small: !p.small }); zeichneSeite(); }
      if (a === 'breit') { Store.updateBlock(p.id, { wide: !p.wide }); zeichneSeite(); }
      if (a === 'rename') {
        const n = await UI.frage('Neuer Titel', p.text);
        if (n !== null) { Store.updateBlock(p.id, { text: n }); zeichneBaum(); if (p.id === seiteId) zeichneSeite(); }
      }
      if (a === 'dup')  { dupliziereSeite(p.id, p.parentId); zeichneBaum(); UI.toast('Seite dupliziert'); }
      if (a === 'link') { navigator.clipboard?.writeText(location.origin + location.pathname + '#' + p.id); UI.toast('Link kopiert'); }
      if (a === 'pid') {
        navigator.clipboard?.writeText(p.id);
        UI.toast('Seiten-ID kopiert: ' + p.id);
      }
      if (a === 'komm') Kommentare.panel(p.id);
      if (a === 'vorschlag') vorschlagModus(p);
      if (a === 'vorschlaege') vorschlaegeZeigen(p);
      if (a === 'uebersetzen') uebersetzenMenue(anker, p);
      if (a === 'undo') Verlauf.zurueck();
      if (a === 'updates') updatesUndAnalysen(p);
      if (a === 'benach') benachrichtigungMenue(anker, p);
      if (a === 'verbind') verbindungenMenue(anker, p);
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

  /**
   * Der Cover-Wähler. Aufbau wie in Notions App: oben Entfernen · Titel ·
   * Schliessen, darunter Reiter, darunter Gruppen mit Kacheln.
   */
  const COVER_GRUPPEN = [
    ['Farbe und Gradient', [
      '#e03e3e', '#ffdc49', '#2eaadc', '#f7f3ee',
      'linear-gradient(160deg,#7fd4d0,#e8c9b0)', 'linear-gradient(160deg,#ff2d78,#ff7bb0)',
      'linear-gradient(160deg,#e8845a,#e03e3e)', 'linear-gradient(160deg,#cfe3ee,#e8b9a8)',
      'linear-gradient(140deg,#2b6cb0,#e03e3e)', 'linear-gradient(140deg,#6d5bd0,#e255a1)',
      'linear-gradient(140deg,#c9a89a,#529cca)'
    ]],
    ['Verläufe und Flächen', [
      'linear-gradient(120deg,#2eaadc,#9a6dd7)', 'linear-gradient(120deg,#ffa344,#ff7369)',
      'linear-gradient(120deg,#4dab9a,#529cca)', 'linear-gradient(120deg,#37352f,#787774)',
      'linear-gradient(200deg,#529cca,#4dab9a)', 'linear-gradient(200deg,#ffdc49,#4dab9a)',
      '#9a6dd7', '#4dab9a'
    ]],
    ['Papier und Struktur', [
      'repeating-linear-gradient(45deg,#3a3a38,#3a3a38 6px,#403f3c 6px,#403f3c 12px)',
      'repeating-linear-gradient(90deg,#2f4858,#2f4858 4px,#33506080 4px,#33506080 8px)',
      'radial-gradient(circle at 30% 30%,#6b8f9c,#2f4858)',
      'radial-gradient(circle at 70% 20%,#c9b8a8,#6b5b4d)',
      'conic-gradient(from 200deg,#4dab9a,#529cca,#9a6dd7,#4dab9a)',
      'conic-gradient(from 20deg,#ffa344,#e03e3e,#9a6dd7,#ffa344)'
    ]]
  ];

  const coverWaehlen = (p) => {
    let reiter = 'galerie';
    const o = document.createElement('div');
    o.className = 'overlay cover-overlay';
    document.body.appendChild(o);

    const zeichne = () => {
      o.innerHTML =
        '<div class="cover-blatt">' +
          '<div class="cb-kopf">' +
            '<button class="cb-links" data-a="weg">Entfernen</button>' +
            '<b>Seiten-Cover</b>' +
            '<button class="cb-rechts" data-a="zu">Schliessen</button>' +
          '</div>' +
          '<div class="cb-reiter">' +
            [['galerie', 'Galerie'], ['hoch', 'Hochladen'], ['link', 'Link']]
              .map(([id, n]) => `<button data-r="${id}" class="${reiter === id ? 'on' : ''}">${n}</button>`).join('') +
          '</div>' +
          '<div class="cb-inhalt">' +
            (reiter === 'galerie'
              ? COVER_GRUPPEN.map(([name, liste]) =>
                  `<div class="cb-grp">${esc(name)}</div>` +
                  '<div class="cover-gitter">' +
                    liste.map(f => `<button data-c="${esc(f)}" style="background:${f}"` +
                      `${p.cover === f ? ' class="on"' : ''}></button>`).join('') +
                  '</div>').join('')
              : reiter === 'hoch'
                ? '<div class="cb-mitte"><button class="cb-knopf" data-a="bild">Bild wählen</button>' +
                  '<div class="cb-hinweis">Bis 6 MB. Das Bild bleibt auf diesem Gerät.</div></div>'
                : '<div class="cb-mitte"><input id="cb-link" placeholder="https://…">' +
                  '<button class="cb-knopf" data-a="linkok">Übernehmen</button>' +
                  '<div class="cb-hinweis">Die Adresse eines Bildes im Netz.</div></div>') +
          '</div>' +
        '</div>';
    };
    zeichne();

    o.addEventListener('click', e => {
      const r = e.target.closest('[data-r]');
      if (r) { reiter = r.dataset.r; zeichne(); return; }
      const c = e.target.closest('[data-c]');
      if (c) { Store.updateBlock(p.id, { cover: c.dataset.c }); o.remove(); zeichneSeite(); return; }
      if (e.target.closest('[data-a="weg"]')) {
        Store.updateBlock(p.id, { cover: '' }); o.remove(); zeichneSeite(); return;
      }
      if (e.target.closest('[data-a="linkok"]')) {
        const v = o.querySelector('#cb-link').value.trim();
        if (v) { Store.updateBlock(p.id, { cover: v }); o.remove(); zeichneSeite(); }
        return;
      }
      if (e.target.closest('[data-a="bild"]')) {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.addEventListener('change', () => {
          const f = inp.files[0]; if (!f) return;
          if (f.size > 6 * 1024 * 1024) { UI.toast('Bitte ein Bild unter 6 MB'); return; }
          const rd = new FileReader();
          rd.onload = () => { Store.updateBlock(p.id, { cover: rd.result }); o.remove(); zeichneSeite(); };
          rd.readAsDataURL(f);
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
  /* Sonderansichten — Bibliothek, Meine Aufgaben. Sie ersetzen den Seiteninhalt,
     ohne eine echte Seite zu sein, genau wie bei Notion. */
  let sonder = null;
  const zeigeSonder = (titel, zeichner) => {
    sonder = { titel, zeichner };
    seiteId = null;
    location.hash = '#' + titel.toLowerCase().replace(/[^a-z]+/g, '-');
    zeichneBaum();
    zeichneSeite();
    document.getElementById('scroll').scrollTop = 0;
  };

  const oeffne = (id) => {
    sonder = null;
    if (seiteId && seiteId !== id && !navSperre) { rueck.push(seiteId); vor.length = 0; }
    if (seiteId && seiteId !== id) Werkzeuge.versionAutomatisch(seiteId);
    seiteId = id;
    if (id) {
      const p = Store.getBlock(id);
      if (p) Store.updateBlock(id, { aufrufe: (p.aufrufe || 0) + 1, zuletztGeoeffnet: Store.now() });
    }
    Store.setMeta('letzte', id);
    if (id) kuerzlichMerken(id);
    location.hash = id || '';
    zeichneBaum();
    zeichneSeite();
    if (window.Fenster) Fenster.gemerkt(id);
    document.getElementById('scroll').scrollTop = 0;
  };

  /**
   * Zeichnet die offene Seite neu.
   * @param {string} fokus  ID des Blocks, der danach den Cursor bekommt
   * @param {string} wo     'ende' setzt den Cursor ans Textende
   */
  /* ------------------------------------------------------------------------
   * INHALTS-STREIFEN AM RECHTEN RAND
   * ------------------------------------------------------------------------
   * Notion zeigt neben jeder längeren Seite ein paar kurze Striche — einen
   * je Überschrift. Wer darüberfährt, sieht die Namen; ein Klick springt hin.
   * Ab drei Überschriften lohnt es sich, darunter wäre es nur Zierde.
   * ----------------------------------------------------------------------*/
  const streifenZeichnen = () => {
    document.getElementById('rand-toc')?.remove();
    const seite = seiteId ? Store.getBlock(seiteId) : null;
    if (!seite) return;

    const kopfzeilen = Store.childrenOf(seite.id)
      .filter(b => ['h1', 'h2', 'h3'].includes(b.type) && (b.text || '').trim());
    if (kopfzeilen.length < 3) return;

    const d = document.createElement('div');
    d.id = 'rand-toc';
    d.innerHTML = kopfzeilen.map(b =>
      `<button data-bid="${b.id}" class="rt-${b.type}" title="${esc(b.text)}">` +
      `<i></i><span>${esc(b.text)}</span></button>`).join('');
    document.getElementById('main').appendChild(d);

    d.addEventListener('click', e => {
      const b = e.target.closest('[data-bid]');
      if (!b) return;
      const el = document.querySelector(`[data-bid="${b.dataset.bid}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* Der Strich, bei dem man gerade steht, wird hervorgehoben. */
    const scroll = document.getElementById('scroll');
    const mitlaufen = () => {
      if (!document.body.contains(d)) { scroll.removeEventListener('scroll', mitlaufen); return; }
      let jetzt = null;
      kopfzeilen.forEach(b => {
        const el = document.querySelector(`.blk[data-bid="${b.id}"]`);
        if (el && el.getBoundingClientRect().top < 140) jetzt = b.id;
      });
      d.querySelectorAll('button').forEach(x =>
        x.classList.toggle('jetzt', x.dataset.bid === jetzt));
    };
    scroll.addEventListener('scroll', mitlaufen, { passive: true });
    mitlaufen();
  };

  const zeichneSeite = (fokus = null, wo = 'anfang') => {
    const wrap = document.getElementById('page');

    if (sonder) {
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
    t.spellcheck = !!Store.getMeta('rechtschreib', false);
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

    /* Wiki-Verzeichnis */
    if (p.wiki) Werkzeuge.wikiIndex(p, wrap);

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
    streifenZeichnen();

    /* Fokus setzen */
    if (fokus) {
      const ct = document.querySelector(`[data-bid="${fokus}"] .ct`);
      if (ct) { if (wo === 'ende') Blocks.cursorAnsEnde(ct); else ct.focus(); }
    }
  };

  const zeichneCrumbs = () => {
    const c = document.getElementById('crumb');
    if (sonder) { c.innerHTML = '<a>' + esc(sonder.titel) + '</a>'; return; }
    if (!seiteId) { c.innerHTML = ''; return; }
    /* „Pfadnavigation anzeigen" — aus zeigt nur die Seite selbst */
    const jetzt = Store.getBlock(seiteId);
    const pfad = jetzt && jetzt.pfad === false ? [jetzt] : Store.pathOf(seiteId);
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
    /* Schloss zeigt den Zustand, nicht nur die Aktion */
    const schloss = document.getElementById('btn-lock');
    if (schloss && p) {
      schloss.textContent = p.gesperrt ? '🔒' : '🔓';
      schloss.classList.toggle('on', !!p.gesperrt);
      schloss.title = p.gesperrt ? 'Seite ist gesperrt — zum Entsperren klicken'
                                 : 'Seite gegen Bearbeiten sperren';
    }
    /* Der Blitz nur dort, wo es auch eine Datenbank gibt */
    const blitz = document.getElementById('btn-auto');
    if (blitz && p) {
      const hatDb = Store.childrenOf(p.id).some(b => b.type === 'database');
      blitz.style.display = hatDb ? '' : 'none';
    }
  };

  /* ========================================================================
   * SUCHE
   * ======================================================================*/
  const suche = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder such" style="width:min(820px,95vw)">' +
        '<input id="q" placeholder="Suchen — auch typ:seite, in:Projekte, nach:2026-01, tag:wichtig, &quot;genauer Satz&quot;" autocomplete="off">' +
        '<div class="such-filter">' +
          '<select id="f-wo"><option value="alles">Titel und Inhalt</option>' +
            '<option value="titel">nur Titel</option><option value="inhalt">nur Inhalt</option></select>' +
          '<select id="f-typ"><option value="alles">Alle Seiten</option>' +
            '<option value="seite">ohne Datenbank</option><option value="datenbank">mit Datenbank</option></select>' +
          '<select id="f-seit"><option value="alles">Jederzeit</option>' +
            '<option value="tag">heute geändert</option><option value="woche">diese Woche</option>' +
            '<option value="monat">dieser Monat</option></select>' +
          '<select id="f-ort"><option value="">Überall</option>' +
            Store.rootPages().map(p2 => `<option value="${p2.id}">in ${esc(p2.text || 'Ohne Titel')}</option>`).join('') +
          '</select>' +
        '</div>' +
        '<div class="such-koerper">' +
          '<div class="res" id="res"></div>' +
          '<div class="such-vorschau" id="vorschau"></div>' +
        '</div>' +
        '<div class="hint">↑ ↓ auswählen · Enter öffnen · Esc schliessen · ' +
          'Befehle: <code>typ:seite</code> <code>in:Projekte</code> <code>nach:2026-01</code> ' +
          '<code>tag:wichtig</code> <code>titel:Wort</code> <code>"genauer Satz"</code></div>' +
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
          (t.pfad ? `<span class="snip pfad">${esc(t.pfad)}</span>` : '') +
          (t.treffer === 'Inhalt' ? `<span class="snip">${esc(t.snippet)}</span>` : '') +
          `</span><span class="pth">${t.treffer}</span></button>`).join('');
      res.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => { oeffne(treffer[+b.dataset.i].page.id); o.remove(); });
        b.addEventListener('mouseenter', () => zeigeVorschau(+b.dataset.i));
      });
      res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
      zeigeVorschau(i);
    };

    /* Rechts eine kleine Vorschau der markierten Seite */
    const zeigeVorschau = (k) => {
      const v = o.querySelector('#vorschau');
      if (!v) return;
      const t = treffer[k];
      if (!t) { v.innerHTML = ''; return; }
      const p2 = t.page;
      const inhalt = Store.childrenOf(p2.id).slice(0, 14).map(b => {
        if (b.type === 'database') {
          const c = Store.getCollection(b.collectionId);
          return `<div class="vs-db">🗂 ${esc(c ? c.name : 'Datenbank')} · ` +
                 `${c ? Store.rowsOf(c.id).length : 0} Einträge</div>`;
        }
        if (!b.text) return '';
        const marke = { h1:'vs-h1', h2:'vs-h2', h3:'vs-h3' }[b.type] || 'vs-t';
        return `<div class="${marke}">${esc(b.text.slice(0, 120))}</div>`;
      }).join('');
      v.innerHTML =
        `<div class="vs-kopf">${esc(p2.icon || '📄')} <b>${esc(p2.text || 'Ohne Titel')}</b></div>` +
        `<div class="vs-meta">${esc(Store.pfadText(p2.id) || 'oberste Ebene')} · ` +
        `zuletzt ${esc(Werkzeuge.zeitKurz(p2.edited))}</div>` +
        (inhalt || '<div class="vs-t" style="opacity:.5">Diese Seite ist noch leer.</div>');
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

    const filterLesen = () => ({
      wo:   o.querySelector('#f-wo').value,
      typ:  o.querySelector('#f-typ').value,
      seit: o.querySelector('#f-seit').value,
      ort:  o.querySelector('#f-ort').value
    });

    /* ------------------------------------------------------------------
     * ABFRAGESPRACHE
     * ------------------------------------------------------------------
     * Notions Suche kennt nur Wörter. Hier lassen sich Bedingungen davor
     * schreiben, wie in einer Suchmaschine:
     *
     *   typ:seite        nur Seiten ohne Datenbank
     *   typ:datenbank    nur Seiten mit Datenbank
     *   in:Projekte      nur unterhalb dieser Seite
     *   nach:2026-01     nur seit diesem Datum geändert
     *   vor:2026-08      nur davor
     *   tag:wichtig      trägt dieses Schlagwort
     *   titel:Rechnung   nur im Titel
     *   "genauer Satz"   muss wörtlich vorkommen
     * ---------------------------------------------------------------- */
    const abfrageLesen = (roh) => {
      const f = { wo: 'alles', typ: 'alles', seit: 'alles', ort: '' };
      const woerter = [], genau = [];
      let nach = null, vor = null, tag = null;

      /* Zuerst die Ausdrücke in Anführungszeichen herausnehmen */
      const ohneGenau = roh.replace(/"([^"]+)"/g, (_, t) => { genau.push(t); return ' '; });

      ohneGenau.split(/\s+/).filter(Boolean).forEach(w => {
        const m = w.match(/^(typ|in|nach|vor|tag|titel|inhalt):(.+)$/i);
        if (!m) { woerter.push(w); return; }
        const [, schluessel, wert] = m;
        const k = schluessel.toLowerCase();
        if (k === 'typ')    f.typ = /daten/i.test(wert) ? 'datenbank' : 'seite';
        if (k === 'titel')  { f.wo = 'titel';  woerter.push(wert); }
        if (k === 'inhalt') { f.wo = 'inhalt'; woerter.push(wert); }
        if (k === 'in') {
          const ziel = Store.rootPages().find(p2 =>
            (p2.text || '').toLowerCase().startsWith(wert.toLowerCase()));
          if (ziel) f.ort = ziel.id;
        }
        if (k === 'nach') nach = wert;
        if (k === 'vor')  vor  = wert;
        if (k === 'tag')  tag  = wert.toLowerCase();
      });

      return { f, text: woerter.join(' '), genau, nach, vor, tag,
               hatBefehl: woerter.length !== ohneGenau.split(/\s+/).filter(Boolean).length ||
                          genau.length > 0 };
    };

    const suchen = () => {
      const roh = inp.value;
      if (!roh.trim()) { zuletzt(); return; }

      const q = abfrageLesen(roh);
      /* Die Filterleiste hat Vorrang, wenn sie ausdrücklich gesetzt wurde */
      const handFilter = filterLesen();
      const filter = {
        wo:   handFilter.wo   !== 'alles' ? handFilter.wo   : q.f.wo,
        typ:  handFilter.typ  !== 'alles' ? handFilter.typ  : q.f.typ,
        seit: handFilter.seit,
        ort:  handFilter.ort  || q.f.ort
      };

      /* Ohne freie Wörter suchen wir mit den Ausdrücken in Anführungszeichen —
         sonst käme die rohe Eingabe samt Anführungszeichen in die Suche. */
      const suchtext = q.text || q.genau.join(' ') || roh;
      treffer = Store.search(suchtext, filter);

      /* Nachfiltern, was Store.search nicht kennt */
      if (q.genau.length) treffer = treffer.filter(t => {
        const text = ((t.page.text || '') + ' ' + (t.snippet || '')).toLowerCase();
        return q.genau.every(g => text.includes(g.toLowerCase()));
      });
      if (q.nach) treffer = treffer.filter(t => (t.page.edited || '') >= q.nach);
      if (q.vor)  treffer = treffer.filter(t => (t.page.edited || '') <= q.vor + '￿');
      if (q.tag)  treffer = treffer.filter(t =>
        Store.childrenOf(t.page.id).some(b => (b.text || '').toLowerCase().includes('#' + q.tag)) ||
        (t.page.text || '').toLowerCase().includes('#' + q.tag));

      i = 0;
      zeichne();
    };
    inp.addEventListener('input', suchen);
    o.querySelectorAll('.such-filter select').forEach(s2 => s2.addEventListener('change', suchen));

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
  /** Wohin soll das Wiederhergestellte? Notion legt es immer an den alten Ort. */
  const wohin = (id, fertig) => {
    const b = Store.getBlock(id);
    if (!b) return;
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
    setTimeout(() => inp.focus(), 40);
    inp.addEventListener('input', () => {
      const q = inp.value.toLowerCase();
      o.querySelectorAll('#wo-r button[data-ziel]').forEach(btn => {
        btn.style.display = !q || btn.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const z = e.target.closest('[data-ziel]');
      if (!z) return;
      const ziel = z.dataset.ziel;
      Store.restoreBlock(id);
      /* An den neuen Ort hängen */
      const alt = Store.getBlock(Store.getBlock(id).parentId);
      if (alt) Store.updateBlock(alt.id, { content: (alt.content || []).filter(x => x !== id) });
      Store.updateBlock(id, { parentId: ziel || null });
      if (ziel) {
        const neuEltern = Store.getBlock(ziel);
        if (neuEltern && !(neuEltern.content || []).includes(id))
          Store.updateBlock(ziel, { content: [...(neuEltern.content || []), id] });
      }
      o.remove();
      UI.toast(ziel ? 'Wiederhergestellt unter „' + (Store.getBlock(ziel).text || 'Seite') + '"'
                    : 'Ganz oben wiederhergestellt');
      if (fertig) fertig();
    });
  };

  const papierkorb = () => {
    /* Wie bei Notion: Suchfeld oben, drei Filterknöpfe, je Zeile ein Pfeil
       zum Zurückholen und ein Eimer zum endgültigen Löschen. */
    let suche = '', filterVon = '', filterOrt = '', filterBereich = '';

    const o = document.createElement('div');
    o.className = 'overlay';
    document.body.appendChild(o);

    const zeichne = () => {
      const alle = Store.trashed();
      let liste = alle;
      if (suche) liste = liste.filter(p => (p.text || '').toLowerCase().includes(suche.toLowerCase()));
      if (filterVon) liste = liste.filter(p => (p.geaendertVon || p.erstelltVon || 'Ich') === filterVon);
      if (filterOrt) liste = liste.filter(p => (p.parentId || '') === filterOrt);
      if (filterBereich) liste = liste.filter(p => (p.bereich || '') === filterBereich);

      const chip = (id, text, an) =>
        `<button class="pk-chip${an ? ' on' : ''}" data-f="${id}">${text}<span>⌄</span></button>`;

      /* Archiviertes ist nicht gelöscht — es steht als eigene Gruppe darüber */
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
                archiv.map(x =>
                  `<button data-arch="${x.id}">` +
                  `<span>${x.icon || '🗄'}</span>` +
                  `<span style="flex:1">${esc(x.text || 'Ohne Titel')}` +
                  `<span class="snip">archiviert ${esc(Werkzeuge.zeitKurz(x.archiviertAm))}</span></span>` +
                  '<span class="pk-tat" data-a="entarchiv" title="Zurückholen">↩</span></button>').join('') +
                '<div class="grp">Papierkorb</div>'
              : '') +
            (liste.length
              ? liste.map(p =>
                  `<button data-id="${p.id}">` +
                  `<span>${p.icon || '📄'}</span>` +
                  `<span style="flex:1">${esc(p.text || 'Ohne Titel')}` +
                  `<span class="snip">gelöscht ${esc(Werkzeuge.zeitKurz(p.trashedAt))}</span></span>` +
                  '<span class="pk-tat" data-a="restore" title="Wiederherstellen">↩</span>' +
                  '<span class="pk-tat" data-a="restore-wo" title="An anderer Stelle wiederherstellen">↳</span>' +
                  '<span class="pk-tat weg" data-a="purge" title="Endgültig löschen">🗑</span>' +
                  '</button>').join('')
              : `<div class="pk-leer">${alle.length ? 'Nichts gefunden.' : 'Der Papierkorb ist leer'}</div>`) +
          '</div>' +
          '<div class="hint pk-hint">Nachdem eine Seite 30 Tage lang im Papierkorb war, wird sie ' +
          'automatisch gelöscht. Endgültig gelöschte Seiten lassen sich nicht zurückholen.' +
          (alle.length ? '<button class="pk-alle" data-a="alle">Papierkorb leeren</button>' : '') +
          '</div>' +
        '</div>';

      const inp = o.querySelector('#pk-suche');
      inp.addEventListener('input', () => {
        suche = inp.value;
        const stelle = inp.selectionStart;
        zeichne();
        const neu = o.querySelector('#pk-suche');
        neu.focus(); neu.setSelectionRange(stelle, stelle);
      });
      inp.focus();
    };

    o.addEventListener('click', async e => {
      if (e.target === o) { o.remove(); return; }

      const f = e.target.closest('[data-f]');
      if (f) {
        const r = f.getBoundingClientRect();
        const alle = Store.trashed();
        let eintraege = [], setzen = () => {};
        if (f.dataset.f === 'von') {
          eintraege = [...new Set(alle.map(p => p.geaendertVon || p.erstelltVon || 'Ich'))]
            .map(n => [n, '👤 ' + n]);
          setzen = v => { filterVon = v; };
        } else if (f.dataset.f === 'ort') {
          eintraege = [...new Set(alle.map(p => p.parentId).filter(Boolean))]
            .map(id => [id, '📄 ' + ((Store.getBlock(id) || {}).text || 'Seite')]);
          setzen = v => { filterOrt = v; };
        } else {
          eintraege = (Store.getMeta('bereiche', []) || []).map(b => [b.id, (b.icon || '👥') + ' ' + b.name]);
          setzen = v => { filterBereich = v; };
        }
        const m = UI.menu('<button data-v="">Alle</button>' +
          (eintraege.length
            ? eintraege.map(([v, t]) => `<button data-v="${esc(v)}">${esc(t)}</button>`).join('')
            : '<div class="grp">Nichts zur Auswahl</div>'),
          r.left, r.bottom + 4);
        m.addEventListener('click', ev => {
          const b2 = ev.target.closest('[data-v]');
          if (!b2) return;
          setzen(b2.dataset.v); m.remove(); zeichne();
        });
        return;
      }

      if (e.target.closest('[data-a="alle"]')) {
        if (!confirm('Alles im Papierkorb endgültig löschen?')) return;
        Store.trashed().forEach(p => Store.purgeBlock(p.id));
        zeichne(); zeichneBaum(); UI.toast('Papierkorb geleert');
        return;
      }

      const arch = e.target.closest('button[data-arch]');
      if (arch) {
        Store.updateBlock(arch.dataset.arch, { archiviert: false, archiviertAm: '' });
        zeichne(); zeichneBaum();
        UI.toast('Aus dem Archiv geholt');
        return;
      }

      const s = e.target.closest('[data-a]');
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      const id = b.dataset.id;
      if (s && s.dataset.a === 'restore') {
        /* Ist der alte Ort selbst im Papierkorb, käme die Seite nicht zurück —
           Notion sagt in dem Fall nichts und man sucht ewig. */
        const b2 = Store.getBlock(id);
        const eltern = b2 && b2.parentId ? Store.getBlock(b2.parentId) : null;
        if (eltern && eltern.alive === false) {
          UI.toast('Der alte Ort liegt selbst im Papierkorb — wähle einen neuen');
          wohin(id, () => { zeichne(); zeichneBaum(); });
          return;
        }
        Store.restoreBlock(id); zeichne(); zeichneBaum(); UI.toast('Wiederhergestellt'); return;
      }
      if (s && s.dataset.a === 'restore-wo') { wohin(id, () => { zeichne(); zeichneBaum(); }); return; }
      if (s && s.dataset.a === 'purge') {
        if (!confirm('Endgültig löschen? Das lässt sich nicht rückgängig machen.')) return;
        Store.purgeBlock(id); zeichne(); UI.toast('Endgültig gelöscht'); return;
      }
      Store.restoreBlock(id); o.remove(); oeffne(id);
    });

    zeichne();
  };

  /* ========================================================================
   * EINSTELLUNGEN
   * ======================================================================*/
  /* Der Einstellungsbereich liegt in einer eigenen Datei. */
  const einstellungen = (bereich) => Einstellungen.oeffne(bereich);

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
    /* Mit einem eigenen Farbschema heisst „umschalten": zum passenden
       Gegenstück wechseln, nicht das Schema übergehen. */
    if (window.Aussehen) {
      const jetzt = Aussehen.einstellung();
      const s = Aussehen.SCHEMATA.find(x => x.id === jetzt.schema);
      if (s && s.grund !== neu) {
        const gegen = Aussehen.SCHEMATA.find(x => x.grund === neu &&
          (neu === 'light' ? x.id === 'hell' : x.id === 'standard'));
        if (gegen) Aussehen.setzen({ schema: gegen.id });
      }
    }
    document.documentElement.dataset.theme = neu;
    Store.setMeta('theme', neu);
  };

  /* ========================================================================
   * EXPORT
   * ======================================================================*/
  /** Die Seite als Markdown — für „Seiteninhalte kopieren" und den Export. */
  const markdownVonSeite = (p) =>
    `# ${p.text || 'Ohne Titel'}\n\n${Werkzeuge.alsMarkdown(p)}\n`;

  const markdownExport = (p) => {
    const md = markdownVonSeite(p);
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

  /* ------------------------------------------------------------------------
   * BREITE DER SEITENLEISTE
   * ---------------------------------------------------------------------- */
  const seitenleisteBreite = () => {
    const side = document.getElementById('sidebar');
    if (!side || side.querySelector('.side-griff')) return;
    const gespeichert = Number(Store.getMeta('seiteBreite', 0));
    const setze = (px) => {
      const b = Math.max(180, Math.min(460, px));
      side.style.width = b + 'px';
      side.style.flexBasis = b + 'px';
      document.documentElement.style.setProperty('--side-w', b + 'px');
      return b;
    };
    if (gespeichert) setze(gespeichert);

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
      setze(260);
      Store.setMeta('seiteBreite', 260);
      UI.toast('Breite zurückgesetzt');
    });
  };

  /* ========================================================================
   * TASTENKÜRZEL
   * ======================================================================*/
  const tasten = () => {
    document.addEventListener('keydown', e => {
      const strg = e.ctrlKey || e.metaKey;
      if (!strg) return;
      const k = e.key.toLowerCase();

      /* Selbst belegte Kürzel haben Vorrang vor den eingebauten. Wer nichts
         umbelegt hat, merkt davon nichts — dann greift die Liste unten. */
      if (window.Aussehen && Object.keys(Aussehen.eigene()).length) {
        const tu = { suche, palette: () => Werkzeuge.palette(), neu: () => neueSeite(),
                     ki: () => kiPanel(), chat: () => KI.neuerChat && KI.neuerChat(),
                     seitenleiste: () => document.getElementById('sidebar').classList.toggle('collapsed'),
                     zurueck, vor: vorwaerts, hell: () => theme(),
                     hilfe: () => Werkzeuge.tastenkuerzel(),
                     einstellung: () => einstellungen(),
                     teilen: () => Fenster.geteilt() ? Fenster.teilenAus() : Fenster.teilen(),
                     reiterNeu: () => Fenster.neuerReiter(),
                     reiterZu: () => Fenster.schliessen(Fenster.aktiv()) };
        for (const id of Object.keys(Aussehen.eigene())) {
          if (tu[id] && Aussehen.ist(id, e)) { e.preventDefault(); tu[id](); return; }
        }
        /* Ein eingebautes Kürzel, das jemand woandershin gelegt hat, darf
           an seiner alten Stelle nichts mehr auslösen. */
        const belegt = Object.keys(Aussehen.eigene());
        const jetzt = Aussehen.alsText(e).toLowerCase();
        const kollision = Aussehen.KUERZEL.find(([id, , std]) =>
          belegt.includes(id) && std.toLowerCase() === jetzt);
        if (kollision) return;
      }

      if (k === 'n' && !e.shiftKey) { e.preventDefault(); neueSeite(); return; }
      /* Strg+Alt+P gehört der Präsentation, nicht der Suche */
      if (k === 'p' && !e.shiftKey && !e.altKey) { e.preventDefault(); suche(); return; }
      if (k === 'k' && !e.shiftKey) { e.preventDefault(); suche(); return; }
      if (k === '\\') { e.preventDefault(); document.getElementById('sidebar').classList.toggle('collapsed'); return; }
      if (k === 'j' && !e.shiftKey) { e.preventDefault(); kiPanel(); return; }
      if (e.shiftKey && k === 'l') { e.preventDefault(); theme(); return; }
      if (k === ',') { e.preventDefault(); einstellungen(); return; }
      if (k === '[') { e.preventDefault(); zurueck(); return; }
      if (k === ']') { e.preventDefault(); vorwaerts(); return; }
      if (k === 'f' && !e.shiftKey) { e.preventDefault(); seitenSuche(); return; }
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); Verlauf.zurueck(); return; }
      /* Strg+Y ist Wiederholen — Strg+Umschalt+Y gehört den Favoriten,
         deshalb hier ausdrücklich ohne Umschalt. */
      if ((k === 'y' && !e.shiftKey) || (e.shiftKey && k === 'z')) {
        e.preventDefault(); Verlauf.vor(); return;
      }
      if (e.shiftKey && k === 'h') { e.preventDefault(); Auswahl.letzteFarbeAnwenden(); return; }

      /* --- Was Notion sonst noch belegt ---------------------------------- */

      /* Strg+L: Adresse dieser Seite kopieren */
      if (k === 'l' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        navigator.clipboard?.writeText(location.origin + location.pathname + '#' + aktuelleSeite());
        UI.toast('Link zur Seite kopiert');
        return;
      }
      /* Strg+Umschalt+U: eine Ebene nach oben in der Seitenhierarchie */
      if (e.shiftKey && k === 'u') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        const eltern = b && b.parentId && Store.getBlock(b.parentId);
        if (eltern) oeffne(eltern.id);
        else UI.toast('Diese Seite liegt schon ganz oben');
        return;
      }
      /* Strg+Alt+T: alle Toggles der Seite auf- oder zuklappen */
      if (e.altKey && k === 't') { e.preventDefault(); Blocks.alleToggles(); return; }

      /* --- Fünf, die an der Seite selbst hängen --------------------------
       * Sie standen bisher nur in Menüs. Bewusst nur Buchstaben, die noch
       * frei sind: Umschalt+F gehört dem Fokus-Modus, Umschalt+P dem
       * Verschieben, Umschalt+G dem Graphen. Ein Kürzel, das ein anderes
       * überdeckt, ist kein Gewinn, sondern ein Fehler.
       * ------------------------------------------------------------------ */
      /* Strg+Umschalt+D: diese Seite verdoppeln */
      if (e.shiftKey && k === 'd') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        if (b) dupliziereSeite(b);
        return;
      }
      /* Strg+Umschalt+Y: an- und abheften */
      if (e.shiftKey && k === 'y') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        if (!b) return;
        Store.updateBlock(b.id, { favorite: !b.favorite });
        zeichneBaum();
        UI.toast(b.favorite ? 'Zu den Favoriten' : 'Von den Favoriten genommen');
        return;
      }
      /* Strg+Umschalt+N: eine Unterseite hier anlegen */
      if (e.shiftKey && k === 'n') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        const p = Store.addPage(b ? b.id : null, { text: '' });
        zeichneBaum();
        oeffne(p.id);
        return;
      }
      /* Strg+Umschalt+B: Papierkorb */
      if (e.shiftKey && k === 'b') { e.preventDefault(); papierkorb(); return; }
      /* Strg+Umschalt+O: Übersicht „Was Redion kann" */
      if (e.shiftKey && k === 'o') {
        e.preventDefault();
        if (window.Rundgang) Rundgang.uebersicht();
        return;
      }
      /* Strg + Plus / Minus / 0: Textgrösse — Notion zoomt, wir vergrössern
         die Schrift, weil das im Browser dasselbe Ziel erreicht. */
      if (!e.shiftKey && (k === '+' || k === '-' || k === '0') && !e.altKey) {
        const stufen = ['klein', 'normal', 'gross'];
        const jetzt = Store.getMeta('schriftgroesse', 'normal');
        let neu = jetzt;
        if (k === '+') neu = stufen[Math.min(2, stufen.indexOf(jetzt) + 1)];
        if (k === '-') neu = stufen[Math.max(0, stufen.indexOf(jetzt) - 1)];
        if (k === '0') neu = 'normal';
        if (neu !== jetzt) {
          e.preventDefault();
          Store.setMeta('schriftgroesse', neu);
          Einstellungen.anwenden();
          UI.toast('Schrift: ' + neu);
        }
        return;
      }
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
    /* Jeder Fehler soll sichtbar werden — eine stumme Seite hilft niemandem. */
    addEventListener('error', (e) => {
      UI.banner('Es ist ein Fehler aufgetreten: ' + (e.message || e.error) +
                ' — bitte melde mir diesen Text.', 'fehler');
    });
    addEventListener('unhandledrejection', (e) => {
      UI.banner('Es ist ein Fehler aufgetreten: ' + (e.reason?.message || e.reason) +
                ' — bitte melde mir diesen Text.', 'fehler');
    });
    Store.beiWarnung((text) => UI.banner(text, 'warn'));

    try {
      await starteWirklich();
    } catch (err) {
      UI.banner('Die App konnte nicht starten: ' + (err.message || err), 'fehler');
      throw err;
    }
  };

  const starteWirklich = async () => {
    await Store.load();

    /* Ist eine Sperre eingerichtet, geht ohne Passwort nichts weiter. */
    await Krypto.startPruefen();

    /* Die App hiess früher „Notizen" und heisst jetzt Redion. Wer den Namen
       nie selbst geändert hat, bekommt den neuen — wer einen eigenen gesetzt
       hat, behält ihn. */
    if (Store.getMeta('arbeitsName', '') === 'Notizen') Store.setMeta('arbeitsName', 'Redion');

    document.documentElement.dataset.theme = Store.getMeta('theme', 'dark');
    Aussehen.start();
    Einstellungen.anwenden();

    if (!Store.rootPages().length) beispielAnlegen();

    /* Das gesammelte Notion-Wissen als echte Seiten — beim ersten Start
       angelegt, danach nur noch, wenn der Text neuer geworden ist. */
    Wissen.sicherstellen();

    /* Eigene Formelfunktionen bereitstellen, bevor die erste Seite rechnet */
    Werkzeuge.formelBibliothekAnwenden();

    /* Fehler sammeln, Papierkorb nach Frist aufräumen */
    Pflege.start();

    const ausHash = location.hash.slice(1).split(':')[0];
    const startSeite = (ausHash && Store.getBlock(ausHash)) ? ausHash
                : (Store.getMeta('letzte') && Store.getBlock(Store.getMeta('letzte')))
                  ? Store.getMeta('letzte')
                  : (Store.rootPages()[0] || {}).id;

    zeichneBaum();
    oeffne(startSeite);

    /* Beim Öffnen zeigen: was in den Einstellungen gewählt ist */
    const wunsch = Store.getMeta('startAnsicht', 'letzte');
    if (!location.hash) {
      if (wunsch === 'start') setTimeout(() => Ansichten.start(), 60);
      if (wunsch === 'posteingang') setTimeout(() => Ansichten.posteingang(), 60);
      if (wunsch === 'journal') setTimeout(() => Werkzeuge.journal(), 60);
      if (wunsch === 'seite' && Store.getMeta('startSeite')) {
        const z = Store.getBlock(Store.getMeta('startSeite'));
        if (z) oeffne(z.id);
      }
    }

    /* Name und Symbol des Arbeitsbereichs */
    const wsBtn = document.getElementById('btn-settings');
    wsBtn.querySelector('.ws-icon').textContent = Store.getMeta('arbeitsIcon', 'N');
    wsBtn.querySelectorAll('span')[1].textContent = Store.getMeta('arbeitsName', 'Redion');

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
    Blocks.auswahlEinklinken();
    Rundgang.vielleichtStarten();

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

    /* Breite der Seitenleiste ziehen — Notion kann das, aber merkt sie sich
       nicht je Gerät; hier bleibt sie gespeichert. */
    seitenleisteBreite();
    an('btn-new', () => neueSeite());
    an('btn-new-bottom', () => neueSeite());
    an('btn-neuer-chat', () => { reiter = 'chat'; zeichneBaum(); KI.neuerChat(); });

    /* Leiste am unteren Rand — nur auf dem Telefon sichtbar */
    /* --- Die untere Leiste am Telefon --------------------------------
     * Sie zeigt jetzt dieselben vier Bereiche wie die Reiterleiste am PC:
     * Start, Chats, Besprechungen, Posteingang. Bisher kam man an drei
     * davon nur über die Schublade — man musste also wissen, dass es sie
     * gibt. Der Kreis in der Mitte bleibt die KI.
     * ---------------------------------------------------------------- */
    an('hl-start', () => { PWA.schubladeZu && PWA.schubladeZu();
                           reiter = 'start'; zeichneBaum(); Ansichten.start(); handyLeiste(); });
    an('hl-chat',  () => { PWA.schubladeZu && PWA.schubladeZu();
                           reiter = 'chat'; zeichneBaum(); handyLeiste();
                           if (PWA.schubladeAuf) PWA.schubladeAuf(); });
    an('hl-bespr', () => { PWA.schubladeZu && PWA.schubladeZu();
                           reiter = 'bespr'; zeichneBaum(); handyLeiste();
                           if (PWA.schubladeAuf) PWA.schubladeAuf(); });
    an('hl-ki', () => kiPanel(true));
    an('hl-inbox', () => { PWA.schubladeZu && PWA.schubladeZu();
                           reiter = 'start'; Ansichten.posteingang(); handyLeiste(); });
    an('btn-suche-handy', () => suche());
    an('btn-neu-handy',   () => neueSeite());
    handyLeiste();

    /* Reiterleiste oben in der Seitenleiste */
    document.getElementById('side-reiter')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-reiter]');
      if (!b) return;
      /* Zweiter Klick auf denselben Reiter öffnet seine Einstellungen —
         genau wie bei Notion beim Home-Reiter. */
      if (b.dataset.reiter === reiter && reiter === 'start') { abschnitteAnpassen(); return; }
      reiterWechseln(b.dataset.reiter);
    });
    an('btn-import', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const m = UI.menu(
        '<div class="grp">Was soll hereinkommen?</div>' +
        '<button data-i="dateien"><span class="mi">📄</span>Dateien wählen' +
          '<span class="sub">Markdown, CSV, TSV, HTML, Excel, Word, EPUB</span></button>' +
        '<button data-i="ordner"><span class="mi">📁</span>Ganzen Ordner einlesen</button>' +
        '<hr><button data-i="werkzeug"><span class="mi">⭱</span>Aus einem anderen Werkzeug' +
          '<span class="sub">Trello, Evernote, Obsidian, Notion-Export, Asana</span></button>' +
        '<hr><div class="grp" style="font-weight:400">Oder einfach eine Datei auf die Seite ziehen.</div>',
        r.right + 6, r.top);
      m.addEventListener('click', ev => {
        const b = ev.target.closest('button[data-i]');
        if (!b) return;
        m.remove();
        if (b.dataset.i === 'dateien')      Werkzeuge.dateienLesen();
        else if (b.dataset.i === 'werkzeug') Austausch.dialog();
        else Werkzeuge.ordnerLesen();
      });
    });
    an('btn-hilfe', () => Werkzeuge.tastenkuerzel());
    an('btn-back', zurueck);
    an('btn-fwd', vorwaerts);
    an('btn-komm', () => seiteId && Kommentare.panel(seiteId));
    an('btn-teilen', (e) => {
      const p = Store.getBlock(seiteId);
      if (p) Werkzeuge.teilenMenue(e.currentTarget, p);
    });
    an('btn-verlauf', () => seiteId && Werkzeuge.versionen(Store.getBlock(seiteId)));
    an('btn-link', () => {
      if (!seiteId) return;
      navigator.clipboard?.writeText(location.origin + location.pathname + '#' + seiteId);
      UI.toast('Link zur Seite kopiert');
    });
    an('btn-lock', () => {
      if (!seiteId) return;
      const p = Store.getBlock(seiteId);
      Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
      zeichneSeite(); zeichneCrumbs();
      UI.toast(p.gesperrt ? 'Seite ist gesperrt' : 'Bearbeiten wieder erlaubt');
    });
    an('btn-auto', (e) => {
      if (!seiteId) return;
      const dbs = Store.childrenOf(seiteId).filter(b => b.type === 'database');
      if (!dbs.length) { UI.toast('Auf dieser Seite gibt es keine Datenbank'); return; }
      const oeffneAuto = (b) => {
        const c = Store.getCollection(b.collectionId);
        const v = Store.getView(b.aktiveView || (c && c.viewIds[0]));
        if (c) Datenbank.automationenMenue(e.currentTarget, c, v, b);
      };
      if (dbs.length === 1) { oeffneAuto(dbs[0]); return; }
      const r = e.currentTarget.getBoundingClientRect();
      const m = UI.menu('<div class="grp">Welche Datenbank?</div>' +
        dbs.map((b, i) => {
          const c = Store.getCollection(b.collectionId);
          return `<button data-i="${i}"><span class="mi">⚡</span>${esc(c ? c.name : 'Datenbank')}</button>`;
        }).join(''), r.left - 140, r.bottom + 6);
      m.addEventListener('click', ev => {
        const b2 = ev.target.closest('button[data-i]');
        if (!b2) return;
        m.remove();
        oeffneAuto(dbs[+b2.dataset.i]);
      });
    });
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

    b('h1', 'Willkommen in Redion');
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
    start, oeffne, zeigeSonder, zeichneSeite, zeichneBaum, zeichneCrumbs, aktuelleSeite, setzeSeite,
    kiPanel, suche, seitenSuche, theme, einstellungen, papierkorb, neueSeite,
    markdownExport, markdownVonSeite, woerterZaehlen, dupliziereSeite, seitenMenue, coverWaehlen,
    kuerzlich, kommendeTermine,
    ABSCHNITTE, abschnittAn, abschnittSchalten, abschnitteAnpassen, reiterWechseln,
    sicherungSpeichern, sicherungLaden, zurueck, vorwaerts
  };
})();

/* Los geht's */
window.addEventListener('DOMContentLoaded', () => { if (!window.__nurBote) App.start(); });
