/* ============================================================================
 * notion.js — Die Bedienschicht, die Notion ausmacht
 * ----------------------------------------------------------------------------
 * Alles, was man in Notion ständig benutzt, ohne darüber nachzudenken:
 *
 *   Rückgängig und Wiederholen      Strg + Z / Strg + Y
 *   Die schwebende Auswahlleiste    Text markieren
 *   Erwähnungen                     @ für Seite, Datum, Person
 *   Emoji-Auswahl                   : mitten im Text
 *   Kommentare                      an jedem Block
 *   Mehrfachauswahl von Blöcken     Esc, Shift + Klick, Strg + A
 *   Startseite und Posteingang      wie Notions Home und Inbox
 *   Das vollständige Seitenmenü     ⋯ oben rechts
 * ==========================================================================*/

/* ==========================================================================
 * 1. RÜCKGÄNGIG UND WIEDERHOLEN
 * --------------------------------------------------------------------------
 * Notion merkt sich die letzten Schritte. Hier geschieht das über
 * Momentaufnahmen der offenen Seite — einfach, aber verlässlich.
 * ========================================================================*/
const Verlauf = (() => {

  const zurueckStapel = [];
  const vorStapel = [];
  const MAX = 60;
  let letzte = 0;
  let sperre = false;

  const momentaufnahme = () => {
    const id = App.aktuelleSeite();
    if (!id) return null;
    const p = Store.getBlock(id);
    if (!p || p.locked) return null;
    return { pageId: id, daten: Store.baum(id) };
  };

  /** Vor einer Änderung aufrufen. Häuft nicht bei jedem Tastendruck an. */
  const merke = (erzwingen = false) => {
    if (sperre) return;
    const jetzt = Date.now();
    if (!erzwingen && jetzt - letzte < 700) return;
    const m = momentaufnahme();
    if (!m) return;
    letzte = jetzt;
    zurueckStapel.push(m);
    if (zurueckStapel.length > MAX) zurueckStapel.shift();
    vorStapel.length = 0;
  };

  const anwenden = (m) => {
    sperre = true;
    const p = Store.getBlock(m.pageId);
    if (!p) { sperre = false; return; }
    Store.kinderLeeren(m.pageId);
    (m.daten.kinder || []).forEach(k => Store.baumEinfuegen(k, m.pageId));
    Store.updateBlock(m.pageId, { text: m.daten.text, icon: m.daten.icon });
    if (App.aktuelleSeite() !== m.pageId) App.oeffne(m.pageId);
    else { App.zeichneSeite(); App.zeichneBaum(); }
    sperre = false;
  };

  const zurueck = () => {
    if (!zurueckStapel.length) { UI.toast('Nichts mehr rückgängig zu machen'); return; }
    const jetzt = momentaufnahme();
    const m = zurueckStapel.pop();
    if (jetzt) vorStapel.push(jetzt);
    anwenden(m);
    UI.toast('Rückgängig');
  };

  const vor = () => {
    if (!vorStapel.length) { UI.toast('Nichts zu wiederholen'); return; }
    const jetzt = momentaufnahme();
    const m = vorStapel.pop();
    if (jetzt) zurueckStapel.push(jetzt);
    anwenden(m);
    UI.toast('Wiederholt');
  };

  /** Hängt sich an die Speicherfunktionen, damit jede Änderung erfasst wird. */
  const start = () => {
    ['updateBlock', 'addBlock', 'trashBlock', 'purgeBlock', 'setProp', 'addDatabase', 'addRow']
      .forEach(name => {
        const original = Store[name];
        Store[name] = function (...args) {
          merke(false);
          return original.apply(Store, args);
        };
      });
  };

  return { start, merke, zurueck, vor, leeren: () => { zurueckStapel.length = 0; vorStapel.length = 0; } };
})();
window.Verlauf = Verlauf;


/* ==========================================================================
 * 2. DIE SCHWEBENDE AUSWAHLLEISTE
 * ========================================================================*/
const Auswahl = (() => {

  let leiste = null;
  let letzteFarbe = 'yellow';

  const weg = () => { if (leiste) { leiste.remove(); leiste = null; } };

  const markierterBlock = () => {
    const s = getSelection();
    if (!s.rangeCount) return null;
    let n = s.getRangeAt(0).startContainer;
    if (n.nodeType === 3) n = n.parentElement;
    const blk = n?.closest?.('.blk');
    return blk ? Store.getBlock(blk.dataset.bid) : null;
  };

  /** Legt Marken um die Auswahl — genau wie Notions Strg + B. */
  const umschliesse = (marke) => {
    const s = getSelection();
    const txt = s.toString();
    if (!txt) return;
    const b = markierterBlock();
    if (!b) return;
    const neu = (b.text || '').replace(txt, marke + txt + marke);
    Store.updateBlock(b.id, { text: neu });
    App.zeichneSeite(b.id, 'ende');
    weg();
  };

  const zeigen = () => {
    const s = getSelection();
    const txt = s.toString().trim();
    if (!txt || !s.rangeCount) { weg(); return; }
    const bereich = s.getRangeAt(0);
    const start = bereich.startContainer.parentElement;
    if (!start || !start.closest('#page') || !start.closest('.ct')) { weg(); return; }

    weg();
    const r = bereich.getBoundingClientRect();
    leiste = document.createElement('div');
    leiste.className = 'auswahlleiste';
    leiste.innerHTML =
      '<button data-a="ki" class="ki">✨ KI</button>' +
      '<span class="tr"></span>' +
      '<button data-a="turn">Umwandeln ▾</button>' +
      '<span class="tr"></span>' +
      '<button data-a="b" title="Fett — Strg B"><b>B</b></button>' +
      '<button data-a="i" title="Kursiv — Strg I"><i>I</i></button>' +
      '<button data-a="u" title="Unterstrichen — Strg U"><u>U</u></button>' +
      '<button data-a="s" title="Durchgestrichen — Strg Shift S"><s>S</s></button>' +
      '<button data-a="c" title="Code — Strg E">&lt;/&gt;</button>' +
      '<button data-a="m" title="Formel">∑</button>' +
      '<button data-a="link" title="Link — Strg K">🔗</button>' +
      '<span class="tr"></span>' +
      '<button data-a="komm" title="Kommentar — Strg Shift M">💬</button>' +
      '<button data-a="farbe" title="Farbe">🎨 ▾</button>';

    document.body.appendChild(leiste);
    const hoehe = leiste.getBoundingClientRect();
    leiste.style.left = Math.max(8, Math.min(r.left, innerWidth - hoehe.width - 10)) + 'px';
    leiste.style.top = Math.max(8, r.top - hoehe.height - 8) + 'px';

    leiste.addEventListener('mousedown', e => e.preventDefault());
    leiste.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      const block = markierterBlock();
      const text = getSelection().toString();

      if (a === 'b') return umschliesse('**');
      if (a === 'i') return umschliesse('*');
      if (a === 'u') return umschliesse('__');
      if (a === 's') return umschliesse('~~');
      if (a === 'c') return umschliesse('`');
      if (a === 'm') return umschliesse('$');
      if (a === 'link') {
        const url = prompt('Adresse des Links', 'https://');
        if (!url || url === 'https://') return;
        const bl = markierterBlock();
        if (!bl) return;
        Store.updateBlock(bl.id, { text: (bl.text || '').replace(text, `[${text}](${url})`) });
        App.zeichneSeite(bl.id, 'ende'); weg();
        return;
      }
      if (a === 'ki') {
        weg();
        App.kiPanel(true);
        KI.frageMitAuswahl(text);
        return;
      }
      if (a === 'komm') { weg(); if (block) Kommentare.neu(block, text); return; }
      if (a === 'turn') {
        const rr = b.getBoundingClientRect();
        weg();
        if (block) Blocks.umwandelnMenue(rr, block);
        return;
      }
      if (a === 'farbe') {
        const rr = b.getBoundingClientRect();
        const FARBEN = [['default','Standard'],['gray','Grau'],['brown','Braun'],['orange','Orange'],
          ['yellow','Gelb'],['green','Grün'],['blue','Blau'],['purple','Lila'],['pink','Pink'],['red','Rot']];
        const m = UI.menu(
          '<div class="grp">Textfarbe</div><div class="swatches">' +
          FARBEN.map(([f, n]) => `<button data-c="${f}" title="${n}" style="background:var(--c-${f})"></button>`).join('') +
          '</div><div class="grp">Hintergrund</div><div class="swatches">' +
          FARBEN.slice(1).map(([f, n]) => `<button data-c="bg-${f}" title="${n}" style="background:var(--b-${f})"></button>`).join('') +
          '</div>', rr.left, rr.bottom + 6);
        m.addEventListener('click', ev => {
          const c = ev.target.closest('button[data-c]');
          if (!c || !block) return;
          letzteFarbe = c.dataset.c;
          Store.updateBlock(block.id, { color: c.dataset.c === 'default' ? '' : c.dataset.c });
          m.remove(); weg(); App.zeichneSeite();
        });
        return;
      }
    });
  };

  const letzteFarbeAnwenden = () => {
    const b = markierterBlock();
    if (!b) return;
    Store.updateBlock(b.id, { color: letzteFarbe });
    App.zeichneSeite();
  };

  const start = () => {
    document.addEventListener('mouseup', e => {
      if (e.target.closest('.auswahlleiste') || e.target.closest('.menu')) return;
      setTimeout(zeigen, 10);
    });
    document.addEventListener('keyup', e => {
      if (e.shiftKey && e.key.startsWith('Arrow')) setTimeout(zeigen, 10);
    });
    document.addEventListener('mousedown', e => {
      if (!e.target.closest('.auswahlleiste')) weg();
    });
    document.addEventListener('scroll', weg, true);
  };

  return { start, zeigen, weg, umschliesse, letzteFarbeAnwenden };
})();
window.Auswahl = Auswahl;


/* ==========================================================================
 * 3. ERWÄHNUNGEN UND EMOJIS
 * --------------------------------------------------------------------------
 * @ für Seite, Datum oder Person · : für Emoji — beides mitten im Text.
 * ========================================================================*/
const Erwaehnung = (() => {

  const EMOJIS = [
    ['😀','lachen freude'],['😃','lachen'],['😄','lachen'],['😁','grinsen'],['😅','schwitzen lachen'],
    ['😂','tränen lachen'],['🙂','lächeln'],['😉','zwinkern'],['😊','freundlich'],['😍','verliebt'],
    ['🤔','denken überlegen'],['🤨','skeptisch'],['😐','neutral'],['😴','schlafen müde'],['😎','cool sonnenbrille'],
    ['😢','traurig weinen'],['😡','wütend ärger'],['🥳','feiern party'],['🤯','kopf explodiert'],['🙏','danke bitte'],
    ['👍','daumen gut ok'],['👎','daumen schlecht'],['👏','applaus klatschen'],['🙌','jubel'],['💪','stark kraft'],
    ['✍️','schreiben'],['👀','augen schauen'],['🧠','gehirn denken'],['❤️','herz liebe'],['🔥','feuer heiss'],
    ['⭐','stern favorit'],['🌟','stern glanz'],['✨','funkeln ki'],['⚡','blitz schnell'],['💡','idee lampe'],
    ['🎯','ziel treffer'],['🏆','pokal gewinn'],['🥇','gold erster'],['🚀','rakete start'],['🛠','werkzeug'],
    ['⚙️','einstellungen zahnrad'],['🔧','schraubenschlüssel'],['🔩','schraube'],['🧩','puzzle vorlage'],['🎨','kunst farbe'],
    ['📌','pin merken'],['📍','ort'],['📎','büroklammer anhang'],['🔗','link kette'],['🔒','schloss sperre'],
    ['🔓','offen'],['🔑','schlüssel'],['🗝','schlüssel alt'],['🛡','schutz sicherheit'],['⏰','wecker erinnerung'],
    ['⏳','sanduhr warten'],['📅','kalender datum'],['📆','kalender'],['🗓','kalender monat'],['🕐','uhr zeit'],
    ['📄','seite dokument'],['📃','seite'],['📑','lesezeichen seiten'],['📋','zwischenablage liste'],['📊','diagramm balken'],
    ['📈','wachstum steigend'],['📉','fallend'],['🗂','ordner register'],['📁','ordner'],['📂','ordner offen'],
    ['🗃','karteikasten'],['🗄','aktenschrank'],['📦','paket box'],['📥','posteingang'],['📤','postausgang'],
    ['✉️','brief mail'],['📧','email'],['📮','briefkasten'],['📝','notiz schreiben'],['✏️','stift'],
    ['🖊','kugelschreiber'],['🖍','wachsmalstift'],['🖌','pinsel'],['📐','geodreieck'],['📏','lineal'],
    ['✅','erledigt haken'],['☑️','angehakt'],['✔️','haken'],['❌','fehler falsch'],['⛔','verboten'],
    ['⚠️','warnung achtung'],['❓','frage'],['❗','ausrufezeichen wichtig'],['💬','kommentar sprechblase'],['🗨','sprechblase'],
    ['🔍','suchen lupe'],['🔎','suchen'],['🔔','glocke benachrichtigung'],['🔕','stumm'],['📢','ankündigung'],
    ['🏠','haus start'],['🏡','zuhause'],['🏢','büro firma'],['🏫','schule'],['🏥','krankenhaus'],
    ['🌍','welt erde'],['🌎','welt'],['🌏','welt asien'],['🗺','karte'],['🧭','kompass'],
    ['☀️','sonne tag'],['🌤','sonnig'],['☁️','wolke'],['🌧','regen'],['❄️','schnee kalt'],
    ['🌙','mond nacht'],['🌱','pflanze wachsen'],['🌳','baum'],['🌸','blume'],['🍀','glück klee'],
    ['🍎','apfel obst'],['🥗','salat gesund'],['🍽','essen'],['☕','kaffee'],['💧','wasser trinken'],
    ['🏃','laufen sport'],['🏋️','gewicht training'],['🧘','meditation ruhe'],['🚴','fahrrad'],['⚽','fussball'],
    ['🎵','musik note'],['🎧','kopfhörer'],['🎬','film'],['📷','kamera foto'],['🎮','spiel'],
    ['💰','geld'],['💵','geldschein'],['💳','karte zahlung'],['🧾','rechnung beleg'],['🏦','bank'],
    ['🚗','auto'],['✈️','flugzeug reise'],['🚆','zug'],['🧳','koffer'],['🛒','einkauf'],
    ['👤','person'],['👥','personen team'],['👨‍💻','entwickler'],['🧑‍🏫','lehrer'],['👪','familie'],
    ['🐾','tier'],['🐶','hund'],['🐱','katze'],['🎓','abschluss lernen'],['📚','bücher lesen'],
    ['📖','buch offen'],['🔖','lesezeichen'],['🗑','papierkorb löschen'],['♻️','recycling'],['🧹','aufräumen']
  ];

  let menue = null;
  const zu = () => { if (menue) { menue.remove(); menue = null; } };

  const textVor = (ct) => {
    const s = getSelection();
    if (!s.rangeCount) return '';
    const r = s.getRangeAt(0).cloneRange();
    r.selectNodeContents(ct);
    r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
    return r.toString();
  };

  const ersetze = (ct, muster, einfuegung) => {
    const b = Store.getBlock(ct.closest('.blk')?.dataset.bid);
    if (!b) return;
    const neu = ct.textContent.replace(muster, einfuegung);
    Store.updateBlock(b.id, { text: neu });
    zu();
    App.zeichneSeite(b.id, 'ende');
  };

  /* --- @ : Seite, Datum, Person ---------------------------------------- */
  const erwaehnungsMenue = (ct, suche) => {
    zu();
    const q = suche.toLowerCase();
    const heute = new Date();
    const tage = (n) => { const d = new Date(heute); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

    const daten = [
      ['Heute', tage(0)], ['Morgen', tage(1)], ['Übermorgen', tage(2)],
      ['Nächste Woche', tage(7)], ['In einem Monat', tage(30)]
    ].filter(([n]) => !q || n.toLowerCase().includes(q));

    const seiten = Links.seiten()
      .filter(p => !q || (p.text || '').toLowerCase().includes(q))
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);

    const ich = Store.getMeta('nutzer', 'Ich');

    let html = '';
    if (seiten.length) {
      html += '<div class="grp">Seiten</div>' + seiten.map(p =>
        `<button data-ein="[[${esc(p.text || '')}]]"><span class="mi">${esc(p.icon || '📄')}</span>` +
        `${esc(p.text || 'Ohne Titel')}</button>`).join('');
    }
    if (daten.length) {
      html += '<div class="grp">Datum</div>' + daten.map(([n, d]) =>
        `<button data-ein="@${d}"><span class="mi">📅</span>${n}<span class="ms">${d}</span></button>`).join('');
      html += `<button data-a="datum"><span class="mi">🗓</span>Datum wählen …</button>`;
    }
    if (!q || ich.toLowerCase().includes(q)) {
      html += '<div class="grp">Person</div>' +
        `<button data-ein="@${esc(ich)}"><span class="mi">👤</span>${esc(ich)}</button>`;
    }
    if (suche.trim()) {
      html += '<hr><button data-ein="[[' + esc(suche.trim()) + ']]"><span class="mi">✚</span>' +
              'Neue Seite „' + esc(suche.trim()) + '"</button>';
    }
    if (!html) html = '<div class="grp">Kein Treffer</div>';

    const r = ct.getBoundingClientRect();
    menue = UI.menu(html, r.left, r.bottom + 4);
    menue.addEventListener('mousedown', e => e.preventDefault());
    menue.addEventListener('click', e => {
      const b = e.target.closest('button[data-ein], button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'datum') {
        const d = prompt('Datum im Format JJJJ-MM-TT', tage(0));
        if (d) ersetze(ct, /@[^@\s]*$/, '@' + d + ' ');
        return;
      }
      ersetze(ct, /@[^@\s]*$/, b.dataset.ein + ' ');
    });
    const erste = menue.querySelector('button[data-ein]');
    if (erste) erste.classList.add('on');
  };

  /* --- : Emoji ---------------------------------------------------------- */
  const emojiMenue = (ct, suche) => {
    zu();
    const q = suche.toLowerCase();
    const treffer = EMOJIS.filter(([e, w]) => !q || w.includes(q)).slice(0, 60);
    if (!treffer.length) return;
    const r = ct.getBoundingClientRect();
    menue = UI.menu(
      '<div class="grp">Emoji</div><div class="swatches emojis">' +
      treffer.map(([e, w]) => `<button data-e="${e}" title="${esc(w)}">${e}</button>`).join('') + '</div>',
      r.left, r.bottom + 4);
    menue.addEventListener('mousedown', e => e.preventDefault());
    menue.addEventListener('click', e => {
      const b = e.target.closest('button[data-e]');
      if (b) ersetze(ct, /:[^:\s]*$/, b.dataset.e);
    });
  };

  /** Die grosse Emoji-Auswahl mit Suchfeld — für Seitensymbole. */
  const emojiWaehler = (anker, beiWahl) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<input class="emoji-suche" placeholder="Emoji suchen …" autocomplete="off">' +
      '<div class="swatches emojis" id="eg"></div>' +
      '<hr><button data-e="">Symbol entfernen</button>', r.left, r.bottom + 6);
    const gitter = m.querySelector('#eg');
    const inp = m.querySelector('.emoji-suche');
    const zeichne = (q = '') => {
      gitter.innerHTML = EMOJIS
        .filter(([e, w]) => !q || w.includes(q.toLowerCase()))
        .map(([e, w]) => `<button data-e="${e}" title="${esc(w)}">${e}</button>`).join('');
    };
    zeichne();
    inp.addEventListener('input', () => zeichne(inp.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') m.remove(); });
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-e]');
      if (!b) return;
      beiWahl(b.dataset.e);
      m.remove();
    });
    setTimeout(() => inp.focus(), 30);
  };

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const start = () => {
    document.getElementById('page').addEventListener('input', e => {
      const ct = e.target.closest('.ct');
      if (!ct) { zu(); return; }
      const vor = textVor(ct);
      const at = vor.match(/(?:^|\s)@([^@\s]*)$/);
      const em = vor.match(/(?:^|\s):([a-zäöü]{2,})$/i);
      if (at) erwaehnungsMenue(ct, at[1]);
      else if (em) emojiMenue(ct, em[1]);
      else zu();
    });

    document.addEventListener('keydown', e => {
      if (!menue) return;
      const btns = [...menue.querySelectorAll('button[data-ein], button[data-e]')];
      const aktiv = menue.querySelector('button.on');
      const i = btns.indexOf(aktiv);
      if (e.key === 'Escape') { zu(); e.stopPropagation(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (aktiv) aktiv.classList.remove('on');
        const j = e.key === 'ArrowDown' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
        if (btns[j]) { btns[j].classList.add('on'); btns[j].scrollIntoView({ block: 'nearest' }); }
        return;
      }
      if (e.key === 'Enter' && (aktiv || btns[0])) {
        e.preventDefault();
        (aktiv || btns[0]).click();
      }
    }, true);
  };

  return { start, emojiWaehler, EMOJIS };
})();
window.Erwaehnung = Erwaehnung;


/* ==========================================================================
 * 4. KOMMENTARE
 * ========================================================================*/
const Kommentare = (() => {

  const alle = (pageId) => {
    const out = [];
    const lauf = (id, tiefe) => {
      Store.childrenOf(id).forEach(b => {
        (b.kommentare || []).forEach(k => out.push({ block: b, k }));
        if (tiefe < 12) lauf(b.id, tiefe + 1);
      });
    };
    lauf(pageId, 0);
    return out;
  };

  const offeneAnzahl = (pageId) => alle(pageId).filter(x => !x.k.erledigt).length;

  const neu = (block, zitat = '') => {
    const text = prompt('Kommentar' + (zitat ? ' zu „' + zitat.slice(0, 40) + '"' : ''));
    if (!text) return;
    const liste = block.kommentare ? block.kommentare.slice() : [];
    liste.push({
      id: Store.uid(), text, zitat: zitat.slice(0, 120),
      autor: Store.getMeta('nutzer', 'Ich'), zeit: Store.now(), erledigt: false
    });
    Store.updateBlock(block.id, { kommentare: liste });
    App.zeichneSeite();
    UI.toast('Kommentar hinzugefügt');
  };

  const panel = (pageId) => {
    const liste = alle(pageId);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">💬 Kommentare <em>${liste.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res">' +
          (liste.length ? liste.map(({ block, k }) =>
            `<div class="komm ${k.erledigt ? 'fertig' : ''}" data-b="${block.id}" data-k="${k.id}">` +
              (k.zitat ? `<div class="komm-zitat">„${esc(k.zitat)}"</div>` : '') +
              `<div class="komm-txt">${esc(k.text)}</div>` +
              `<div class="komm-fuss">${esc(k.autor)} · ${esc(Werkzeuge.zeitKurz(k.zeit))}` +
                `<button data-a="springen">Zur Stelle</button>` +
                `<button data-a="fertig">${k.erledigt ? 'Wieder öffnen' : 'Erledigt'}</button>` +
                `<button data-a="del">Löschen</button></div>` +
            '</div>').join('')
          : '<div style="padding:18px; color:var(--text-faint); font-size:14px">Noch keine Kommentare. ' +
            'Text markieren und auf 💬 klicken.</div>') +
        '</div></div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const box = e.target.closest('.komm');
      if (!box) return;
      const block = Store.getBlock(box.dataset.b);
      if (!block) return;
      const liste2 = (block.kommentare || []).slice();
      const idx = liste2.findIndex(x => x.id === box.dataset.k);
      if (e.target.closest('[data-a="fertig"]')) {
        liste2[idx].erledigt = !liste2[idx].erledigt;
        Store.updateBlock(block.id, { kommentare: liste2 });
        o.remove(); panel(pageId); App.zeichneSeite();
      }
      if (e.target.closest('[data-a="del"]')) {
        liste2.splice(idx, 1);
        Store.updateBlock(block.id, { kommentare: liste2 });
        o.remove(); panel(pageId); App.zeichneSeite();
      }
      if (e.target.closest('[data-a="springen"]')) {
        o.remove();
        const el = document.querySelector(`[data-bid="${block.id}"]`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('blitz');
                  setTimeout(() => el.classList.remove('blitz'), 1400); }
      }
    });
  };

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return { alle, offeneAnzahl, neu, panel };
})();
window.Kommentare = Kommentare;


/* ==========================================================================
 * 5. MEHRFACHAUSWAHL VON BLÖCKEN
 * ========================================================================*/
const Mehrfach = (() => {

  let gewaehlt = new Set();

  const zeichne = () => {
    document.querySelectorAll('.blk').forEach(el =>
      el.classList.toggle('sel', gewaehlt.has(el.dataset.bid)));
  };

  const leeren = () => { gewaehlt.clear(); zeichne(); };
  const hat = () => gewaehlt.size > 0;
  const ids = () => [...gewaehlt];

  /* Auf schmalen Bildschirmen gibt es in Notion keine Mehrfachauswahl —
     dort ist Ziehen zum Markieren dem Scrollen im Weg. */
  const schmal = () => window.matchMedia('(max-width:700px)').matches;

  const waehle = (id, dazu = false) => {
    if (schmal() && dazu) return;
    if (!dazu) gewaehlt.clear();
    gewaehlt.add(id);
    zeichne();
  };

  const bereich = (vonId, bisId) => {
    if (schmal()) return;
    const alle = [...document.querySelectorAll('.blk')].map(e => e.dataset.bid);
    const a = alle.indexOf(vonId), b = alle.indexOf(bisId);
    if (a < 0 || b < 0) return;
    gewaehlt.clear();
    alle.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => gewaehlt.add(x));
    zeichne();
  };

  const start = () => {
    document.addEventListener('keydown', e => {
      const imText = document.activeElement?.classList?.contains('ct');

      /* Esc wählt den Block unter dem Cursor aus */
      if (e.key === 'Escape' && imText && !document.querySelector('.menu, .overlay')) {
        const blk = document.activeElement.closest('.blk');
        if (blk) { document.activeElement.blur(); waehle(blk.dataset.bid); e.preventDefault(); }
        return;
      }
      if (!hat()) return;

      if (e.key === 'Escape') { leeren(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        Verlauf.merke(true);
        ids().forEach(id => { Store.trashBlock(id); Store.purgeBlock(id); });
        leeren(); App.zeichneSeite();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        Verlauf.merke(true);
        ids().forEach(id => {
          const b = Store.getBlock(id);
          if (!b) return;
          const daten = Store.baum(id);
          Store.baumEinfuegen(daten, b.parentId);
        });
        leeren(); App.zeichneSeite();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const p = Store.getBlock(App.aktuelleSeite());
        if (!p) return;
        /* Erst der eigene Block, dann die Geschwister, dann die ganze Seite —
           genau die Stufen, die Notion durchläuft. */
        const alle = new Set(p.content || []);
        if (gewaehlt.size === 0) { gewaehlt = new Set([p.content[0]]); }
        else if (gewaehlt.size < alle.size) { gewaehlt = alle; }
        else { gewaehlt = alle; UI.toast('Alle Blöcke dieser Seite ausgewählt'); }
        zeichne();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const alle = [...document.querySelectorAll('.blk')].map(x => x.dataset.bid);
        const jetzt = ids()[ids().length - 1];
        const i = alle.indexOf(jetzt) + (e.key === 'ArrowDown' ? 1 : -1);
        if (alle[i]) { e.preventDefault(); e.shiftKey ? bereich(ids()[0], alle[i]) : waehle(alle[i]); }
        return;
      }
      if (e.key === 'Enter') {
        const id = ids()[0];
        leeren();
        const ct = document.querySelector(`[data-bid="${id}"] .ct`);
        if (ct) { e.preventDefault(); Blocks.cursorAnsEnde(ct); }
        return;
      }
    });

    document.getElementById('page').addEventListener('click', e => {
      if (e.target.closest('.ct, button, input, a')) { if (!e.shiftKey) leeren(); return; }
      const blk = e.target.closest('.blk');
      if (!blk) { leeren(); return; }
      if (e.shiftKey && hat()) bereich(ids()[0], blk.dataset.bid);
    });
  };

  return { start, waehle, leeren, hat, ids, bereich, schmal };
})();
window.Mehrfach = Mehrfach;


/* ==========================================================================
 * 6. STARTSEITE UND POSTEINGANG
 * ========================================================================*/
const Ansichten = (() => {

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const gruss = () => {
    const h = new Date().getHours();
    const name = Store.getMeta('nutzer', '');
    const teil = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
    return teil + (name && name !== 'Ich' ? ', ' + name : '');
  };

  const start = () => {
    const wrap = document.getElementById('page');
    App.setzeSeite(null);
    document.getElementById('crumb').innerHTML = '<a>🏠 Start</a>';

    const zuletzt = Object.values(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system)
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);

    const offen = Werkzeuge.erinnerungen().filter(e => !e.erledigt);
    const karten = Werkzeuge.faellig().length;
    const journalHeute = Store.getMeta('sys:journal') &&
      Store.childrenOf(Store.getMeta('sys:journal')).some(k => (k.text || '').startsWith(new Date().toISOString().slice(0, 10)));

    wrap.className = '';
    wrap.innerHTML =
      `<div class="home">` +
        `<h1>${esc(gruss())}</h1>` +
        '<div class="home-karten">' +
          `<button class="hk" data-a="journal"><b>📅 Tagesjournal</b>` +
            `<span>${journalHeute ? 'Heutiger Eintrag ist angelegt' : 'Heutigen Eintrag anlegen'}</span></button>` +
          `<button class="hk" data-a="memo"><b>⚡ Schnellnotiz</b><span>Gedanken sofort festhalten</span></button>` +
          `<button class="hk" data-a="lernen"><b>🎴 Karteikarten</b>` +
            `<span>${karten ? karten + ' Karten fällig' : 'Keine Karten fällig'}</span></button>` +
          `<button class="hk" data-a="graph"><b>🕸 Graph</b><span>Wie alles zusammenhängt</span></button>` +
        '</div>' +

        '<h2>Zuletzt bearbeitet</h2>' +
        '<div class="home-liste">' +
          (zuletzt.length ? zuletzt.map(p =>
            `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('')
          : '<div class="leer">Noch keine Seiten</div>') +
        '</div>' +

        (offen.length
          ? '<h2>Anstehende Erinnerungen</h2><div class="home-liste">' +
            offen.sort((a, b) => a.zeit.localeCompare(b.zeit)).slice(0, 5).map(e =>
              `<button data-open="${e.pageId}"><span>⏰</span><span style="flex:1">${esc(e.text)}</span>` +
              `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('') +
            '</div>'
          : '') +

        `<h2>Dein Arbeitsbereich</h2>` +
        `<div class="home-zahlen">` +
          zahl(Links.seiten().length, 'Seiten') +
          zahl(Object.keys(Store.cache.collections).length, 'Datenbanken') +
          zahl(Links.alleTags().length, 'Schlagwörter') +
          zahl(Werkzeuge.karten().length, 'Karteikarten') +
        `</div>` +
      '</div>';

    wrap.addEventListener('click', e => {
      const o = e.target.closest('[data-open]');
      if (o) { App.oeffne(o.dataset.open); return; }
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'journal') Werkzeuge.journal();
      if (a.dataset.a === 'memo') Werkzeuge.schnellnotizen();
      if (a.dataset.a === 'lernen') Werkzeuge.lernen();
      if (a.dataset.a === 'graph') Links.graph();
    });
  };

  const zahl = (n, name) => `<div class="hz"><b>${n}</b><span>${name}</span></div>`;

  const posteingang = () => {
    const erinner = Werkzeuge.erinnerungen();
    const kommentare = [];
    Links.seiten().forEach(p => Kommentare.alle(p.id).forEach(k => kommentare.push({ seite: p, ...k })));
    const geaendert = Object.values(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
      .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 8);

    const wrap = document.getElementById('page');
    App.setzeSeite(null);
    document.getElementById('crumb').innerHTML = '<a>📥 Posteingang</a>';
    wrap.className = '';
    wrap.innerHTML =
      '<div class="home">' +
        '<h1>📥 Posteingang</h1>' +
        '<h2>Erinnerungen</h2><div class="home-liste">' +
          (erinner.length ? erinner.slice().sort((a, b) => b.zeit.localeCompare(a.zeit)).map(e =>
            `<button data-open="${e.pageId}"><span>${e.erledigt ? '✅' : '⏰'}</span>` +
            `<span style="flex:1">${esc(e.text)}</span>` +
            `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('')
          : '<div class="leer">Keine Erinnerungen</div>') +
        '</div>' +
        '<h2>Kommentare</h2><div class="home-liste">' +
          (kommentare.length ? kommentare.slice(0, 12).map(k =>
            `<button data-open="${k.seite.id}"><span>${k.k.erledigt ? '✅' : '💬'}</span>` +
            `<span style="flex:1">${esc(k.k.text)}<span class="snip">${esc(k.seite.text || 'Ohne Titel')}</span></span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(k.k.zeit))}</span></button>`).join('')
          : '<div class="leer">Keine Kommentare</div>') +
        '</div>' +
        '<h2>Zuletzt geändert</h2><div class="home-liste">' +
          geaendert.map(p =>
            `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
            `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('') +
        '</div>' +
      '</div>';

    wrap.addEventListener('click', e => {
      const o = e.target.closest('[data-open]');
      if (o) App.oeffne(o.dataset.open);
    });
  };

  return { start, posteingang, gruss };
})();
window.Ansichten = Ansichten;
