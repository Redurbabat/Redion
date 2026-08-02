/* ============================================================================
 * tools.js — Die Werkzeuge
 * ----------------------------------------------------------------------------
 * Hier steckt alles, was die anderen Notiz-Programme gross gemacht hat —
 * an einem Ort, in einer Oberfläche:
 *
 *   Befehlspalette      SilverBullet      Strg + Shift + P
 *   Tagesjournal        Logseq, Foam      Seitenleiste → Journal
 *   Schnellnotizen      Memos, Blinko     Seitenleiste → Schnellnotizen
 *   Vorlagen            Outline, Trilium  Seitenleiste → Vorlagen
 *   Karteikarten        SiYuan            Seitenleiste → Lernen
 *   Versionsverlauf     Standard Notes    Seitenmenü → Versionen
 *   Seite sperren       Notesnook         Seitenmenü → Sperren
 *   Fokus-Modus         MarkText, Zettlr  Seitenmenü → Fokus
 *   Präsentation        HedgeDoc          Seitenmenü → Präsentation
 *   Quelltext-Modus     MarkText, TUI     Seitenmenü → Markdown
 *   Schreibstatistik    Zettlr            Seitenmenü → Statistik
 *   Erinnerungen        Notesnook         Seitenmenü → Erinnerung
 *   Ordner-Abgleich     Joplin, Zettlr    Einstellungen → Ordner
 *   Eine HTML-Datei     TiddlyWiki        Einstellungen → Als eine Datei
 * ==========================================================================*/

const Werkzeuge = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const heute = () => new Date().toISOString().slice(0, 10);
  const WOCHENTAG = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const MONAT = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  const datumLang = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    return `${WOCHENTAG[d.getDay()]}, ${d.getDate()}. ${MONAT[d.getMonth()]} ${d.getFullYear()}`;
  };

  /** Legt eine Systemseite an oder findet sie wieder (Journal, Vorlagen …). */
  const systemSeite = (schluessel, titel, icon) => {
    const id = Store.getMeta('sys:' + schluessel);
    const da = id && Store.getBlock(id);
    if (da && da.alive) return da;
    const p = Store.addPage(null, { text: titel, icon, system: schluessel });
    Store.setMeta('sys:' + schluessel, p.id);
    return p;
  };

  /* ========================================================================
   * 1. BEFEHLSPALETTE   (SilverBullet)
   * ------------------------------------------------------------------------
   * Ein Fenster, das jeden Befehl der App kennt. Strg + Shift + P.
   * ======================================================================*/
  const befehle = () => {
    const s = App.aktuelleSeite();
    const p = s ? Store.getBlock(s) : null;
    const b = [];
    const c = (gruppe, name, kurz, fn) => b.push({ gruppe, name, kurz, fn });

    c('Navigation', 'Suchen', 'Strg P', () => App.suche());
    c('Navigation', 'Neue Seite', 'Strg N', () => App.neueSeite());
    c('Navigation', 'Startseite', '', () => Ansichten.start());
    c('Navigation', 'Posteingang', '', () => Ansichten.posteingang());
    c('Navigation', 'Tagesjournal öffnen', 'Strg Shift J', () => journal());
    c('Navigation', 'Schnellnotizen', 'Strg Shift M', () => schnellnotizen());
    c('Navigation', 'Graph aller Seiten', 'Strg Shift G', () => Links.graph());
    c('Navigation', 'Schlagwörter', 'Strg Shift T', () => Links.tagRegister());
    c('Navigation', 'Vorlagen', '', () => vorlagen());
    c('Navigation', 'Karteikarten lernen', '', () => lernen());
    c('Navigation', 'Papierkorb', '', () => App.papierkorb());
    c('Navigation', 'Zurück', 'Strg [', () => App.zurueck());
    c('Navigation', 'Vorwärts', 'Strg ]', () => App.vorwaerts());

    if (p) {
      c('Seite', 'Seite umbenennen', '', () => {
        const n = prompt('Neuer Titel', p.text); if (n !== null) { Store.updateBlock(p.id, { text: n }); App.zeichneBaum(); App.zeichneSeite(); }
      });
      c('Seite', 'Symbol ändern', '', () => document.querySelector('.pg-icon')?.click());
      c('Seite', p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen', '',
        () => { Store.updateBlock(p.id, { favorite: !p.favorite }); App.zeichneBaum(); });
      c('Seite', 'Duplizieren', '', () => { App.dupliziereSeite(p.id, p.parentId); App.zeichneBaum(); UI.toast('Dupliziert'); });
      c('Seite', 'Verschieben nach …', '', () => verschiebenNach(p));
      c('Seite', 'Als Vorlage speichern', '', () => alsVorlage(p));
      c('Seite', 'Aus Vorlage einfügen', '', () => vorlageEinfuegen(p));
      c('Seite', 'Versionsverlauf', '', () => versionen(p));
      c('Seite', p.locked ? 'Seite entsperren' : 'Seite verschlüsseln', '', () => p.locked ? entsperren(p) : sperren(p));
      c('Seite', p.gesperrt ? 'Bearbeiten wieder erlauben' : 'Bearbeiten sperren', '',
        () => { Store.updateBlock(p.id, { gesperrt: !p.gesperrt }); App.zeichneSeite(); UI.toast(p.gesperrt ? 'Entsperrt' : 'Gesperrt'); });
      c('Seite', 'Fokus-Modus', 'Strg Shift F', () => fokus());
      c('Seite', 'Präsentation starten', '', () => praesentation(p));
      c('Seite', 'Markdown-Quelltext', '', () => quelltext(p));
      c('Seite', 'Schreibstatistik', '', () => statistik(p));
      c('Seite', 'Erinnerung setzen', '', () => erinnerungSetzen(p));
      c('Seite', 'Als Markdown speichern', '', () => App.markdownExport(p));
      c('Seite', 'Als HTML speichern', '', () => htmlExport(p));
      c('Seite', 'Drucken / als PDF', 'Strg P', () => drucken(p));
      c('Seite', 'Link kopieren', '', () => { navigator.clipboard?.writeText(location.origin + location.pathname + '#' + p.id); UI.toast('Link kopiert'); });
      c('Seite', 'In den Papierkorb', '', () => { Store.trashBlock(p.id); App.zeichneBaum(); App.oeffne((Store.rootPages()[0]||{}).id); UI.toast('In den Papierkorb'); });
    }

    Blocks.TYPEN.forEach(t => c('Einfügen', t.name, t.kurz || '', () => Blocks.einfuegenAmEnde(t.id)));

    c('Ansicht', 'Hell / Dunkel', 'Strg Shift L', () => App.theme());
    c('Ansicht', 'Seitenleiste ein- oder ausblenden', 'Strg \\', () =>
      document.getElementById('sidebar').classList.toggle('collapsed'));
    c('Ansicht', 'KI-Panel', 'Strg J', () => App.kiPanel());
    c('Ansicht', 'Alle Toggles öffnen oder schliessen', 'Strg Alt T', () => alleToggles());
    c('Ansicht', 'Tastenkürzel anzeigen', 'Strg /', () => tastenkuerzel());

    c('Daten', 'Einstellungen', 'Strg ,', () => App.einstellungen());
    c('Daten', 'Sicherung speichern', '', () => App.sicherungSpeichern());
    c('Daten', 'Sicherung laden', '', () => App.sicherungLaden());
    c('Daten', 'Alles in einen Ordner schreiben', '', () => ordnerSchreiben());
    c('Daten', 'Ordner mit Markdown einlesen', '', () => ordnerLesen());
    c('Daten', 'Alles als eine HTML-Datei', '', () => einzelDatei());

    return b;
  };

  const palette = () => {
    const liste = befehle();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<input id="cq" placeholder="Befehl suchen …" autocomplete="off">' +
        '<div class="res" id="cr"></div>' +
        '<div class="hint">↑ ↓ auswählen · Enter ausführen · Esc schliessen</div>' +
      '</div>';
    document.body.appendChild(o);

    const inp = o.querySelector('#cq'), res = o.querySelector('#cr');
    let treffer = liste, i = 0;

    const zeichne = () => {
      let g = '';
      res.innerHTML = treffer.slice(0, 60).map((t, k) => {
        const kopf = t.gruppe !== g ? `<div class="grp">${esc(t.gruppe)}</div>` : '';
        g = t.gruppe;
        return kopf + `<button data-i="${k}"${k === i ? ' class="on"' : ''}>` +
               `<span style="flex:1">${esc(t.name)}</span>` +
               (t.kurz ? `<span class="pth">${esc(t.kurz)}</span>` : '') + '</button>';
      }).join('');
      res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
    };
    zeichne();

    const fuehreAus = (t) => { o.remove(); setTimeout(() => t.fn(), 10); };

    inp.addEventListener('input', () => {
      const q = inp.value.toLowerCase().trim();
      treffer = !q ? liste : liste.filter(t =>
        (t.gruppe + ' ' + t.name).toLowerCase().includes(q) ||
        q.split(' ').every(w => (t.name).toLowerCase().includes(w)));
      i = 0; zeichne();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { o.remove(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); i = Math.min(i + 1, treffer.length - 1); zeichne(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); i = Math.max(i - 1, 0); zeichne(); }
      if (e.key === 'Enter' && treffer[i]) { e.preventDefault(); fuehreAus(treffer[i]); }
    });
    res.addEventListener('click', e => {
      const b = e.target.closest('button[data-i]');
      if (b) fuehreAus(treffer[+b.dataset.i]);
    });
    o.addEventListener('mousedown', e => { if (e.target === o) o.remove(); });
    inp.focus();
  };

  /* ========================================================================
   * 2. TAGESJOURNAL   (Logseq, Foam, SiYuan)
   * ======================================================================*/
  const journalSeite = (iso = heute()) => {
    const eltern = systemSeite('journal', 'Journal', '📅');
    const titel = iso + ' · ' + WOCHENTAG[new Date(iso + 'T12:00:00').getDay()];
    const da = Store.childrenOf(eltern.id).find(k => (k.text || '').startsWith(iso));
    if (da) return da;

    const p = Store.addPage(eltern.id, { text: titel, icon: '📆', journal: iso });
    Store.addBlock(p.id, 'h3', { text: datumLang(iso) });
    Store.addBlock(p.id, 'text', { text: '' });
    Store.updateBlock(eltern.id, { aufgeklappt: true });
    return p;
  };

  const journal = (iso = heute()) => {
    const p = journalSeite(iso);
    App.zeichneBaum();
    App.oeffne(p.id);
  };

  /* ========================================================================
   * 3. SCHNELLNOTIZEN   (Memos, Blinko)
   * ------------------------------------------------------------------------
   * Zeitleiste kurzer Notizen mit Schlagwörtern und einer Heatmap der
   * letzten zwölf Wochen.
   * ======================================================================*/
  const schnellnotizen = () => {
    const eltern = systemSeite('memos', 'Schnellnotizen', '⚡');

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder memos" style="width:min(720px,95vw)">' +
        '<div class="fh">⚡ Schnellnotizen <em id="mz"></em>' +
          '<button class="icon-btn" data-a="seite" title="Als normale Seite öffnen">↗</button>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="memo-neu">' +
          '<textarea id="mt" rows="2" placeholder="Was ist gerade? Mit #schlagwort ordnen … (Strg + Enter speichert)"></textarea>' +
          '<button id="mb" class="prim">Speichern</button>' +
        '</div>' +
        '<div id="mhm" class="heatmap"></div>' +
        '<div class="res" id="ml"></div>' +
      '</div>';
    document.body.appendChild(o);

    const liste = () => Store.childrenOf(eltern.id).slice().reverse();

    const zeichne = () => {
      const alle = liste();
      o.querySelector('#mz').textContent = alle.length + '';
      o.querySelector('#ml').innerHTML = alle.length
        ? alle.map(m =>
            `<div class="memo" data-id="${m.id}">` +
              `<div class="memo-kopf">${esc(zeitKurz(m.created))}` +
                `<button data-a="edit" title="Bearbeiten">✎</button>` +
                `<button data-a="seite2" title="Zu einer Seite machen">↗</button>` +
                `<button data-a="del" title="Löschen">🗑</button></div>` +
              `<div class="memo-txt">${Blocks.inline(m.text || '')}</div>` +
            '</div>').join('')
        : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
          'Noch nichts festgehalten. Oben eintippen und speichern.</div>';

      /* Heatmap der letzten zwölf Wochen */
      const zaehler = {};
      alle.forEach(m => { const t = (m.created || '').slice(0, 10); zaehler[t] = (zaehler[t] || 0) + 1; });
      const zellen = [];
      const start = new Date(); start.setDate(start.getDate() - 83);
      for (let i = 0; i < 84; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const n = zaehler[iso] || 0;
        zellen.push(`<i class="hm${Math.min(4, n)}" title="${iso}: ${n}"></i>`);
      }
      o.querySelector('#mhm').innerHTML = zellen.join('');
    };
    zeichne();

    const speichern = () => {
      const ta = o.querySelector('#mt');
      const txt = ta.value.trim();
      if (!txt) return;
      Store.addBlock(eltern.id, 'text', { text: txt });
      ta.value = '';
      zeichne();
      App.zeichneBaum();
    };

    o.querySelector('#mb').addEventListener('click', speichern);
    o.querySelector('#mt').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); speichern(); }
    });
    o.querySelector('#mt').focus();

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="seite"]')) { o.remove(); App.oeffne(eltern.id); return; }
      const memo = e.target.closest('.memo');
      if (!memo) return;
      const b = Store.getBlock(memo.dataset.id);
      if (!b) return;
      if (e.target.closest('[data-a="del"]')) { Store.trashBlock(b.id); zeichne(); return; }
      if (e.target.closest('[data-a="edit"]')) {
        const n = prompt('Notiz bearbeiten', b.text);
        if (n !== null) { Store.updateBlock(b.id, { text: n }); zeichne(); }
        return;
      }
      if (e.target.closest('[data-a="seite2"]')) {
        const p = Store.addPage(null, { text: (b.text || '').slice(0, 60), icon: '📄' });
        Store.addBlock(p.id, 'text', { text: b.text || '' });
        Store.trashBlock(b.id);
        o.remove(); App.zeichneBaum(); App.oeffne(p.id);
      }
    });
  };

  const zeitKurz = (iso) => {
    if (!iso) return '';
    const d = new Date(iso), j = new Date();
    const gleich = d.toDateString() === j.toDateString();
    const uhr = d.toTimeString().slice(0, 5);
    if (gleich) return 'Heute ' + uhr;
    const gestern = new Date(j); gestern.setDate(j.getDate() - 1);
    if (d.toDateString() === gestern.toDateString()) return 'Gestern ' + uhr;
    return d.toLocaleDateString('de-DE') + ' ' + uhr;
  };

  /* ========================================================================
   * 4. VORLAGEN   (Outline, Trilium, Anytype)
   * ======================================================================*/
  const alsVorlage = (p) => {
    const ordner = systemSeite('vorlagen', 'Vorlagen', '🧩');
    const daten = Store.baum(p.id);
    const neu = Store.baumEinfuegen(daten, ordner.id);
    Store.updateBlock(neu.id, { text: (p.text || 'Ohne Titel'), vorlage: true });
    Store.updateBlock(ordner.id, { aufgeklappt: true });
    App.zeichneBaum();
    UI.toast('Als Vorlage gespeichert');
  };

  const vorlagenListe = () => {
    const id = Store.getMeta('sys:vorlagen');
    return id && Store.getBlock(id) ? Store.childrenOf(id).filter(k => k.type === 'page') : [];
  };

  const vorlageEinfuegen = (ziel) => {
    const liste = vorlagenListe();
    if (!liste.length) { UI.toast('Noch keine Vorlagen — erst eine Seite als Vorlage speichern'); return; }
    const html = '<div class="grp">Vorlage einfügen</div>' + liste.map(v =>
      `<button data-v="${v.id}"><span class="mi">${esc(v.icon || '🧩')}</span>${esc(v.text || 'Ohne Titel')}</button>`).join('');
    const m = UI.menu(html, innerWidth / 2 - 130, 120);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      m.remove();
      const daten = Store.baum(b.dataset.v);
      /* Nur den Inhalt übernehmen, nicht die Vorlagenseite selbst */
      (daten.kinder || []).forEach(k => Store.baumEinfuegen(k, ziel.id));
      App.zeichneSeite();
      UI.toast('Vorlage eingefügt');
    });
  };

  const vorlagen = () => {
    const ordner = systemSeite('vorlagen', 'Vorlagen', '🧩');
    App.zeichneBaum();
    App.oeffne(ordner.id);
  };

  /* ========================================================================
   * 5. KARTEIKARTEN   (SiYuan, Anki-Verfahren SM-2)
   * ======================================================================*/
  const karten = () => Object.values(Store.cache.blocks)
    .filter(b => b.alive && b.type === 'flashcard');

  const faellig = () => {
    const jetzt = Date.now();
    return karten().filter(k => !k.sr || !k.sr.faellig || new Date(k.sr.faellig).getTime() <= jetzt);
  };

  /** SM-2 in kurz: leichter beantwortet = längerer Abstand. */
  const planen = (k, note) => {
    const sr = Object.assign({ ease: 2.5, intervall: 0, wdh: 0 }, k.sr || {});
    if (note < 3) { sr.wdh = 0; sr.intervall = note === 1 ? 0 : 1; }
    else {
      sr.wdh++;
      sr.intervall = sr.wdh === 1 ? 1 : sr.wdh === 2 ? 6 : Math.round(sr.intervall * sr.ease);
      sr.ease = Math.max(1.3, sr.ease + (0.1 - (4 - note) * (0.08 + (4 - note) * 0.02)));
    }
    const d = new Date();
    if (sr.intervall === 0) d.setMinutes(d.getMinutes() + 10);
    else d.setDate(d.getDate() + sr.intervall);
    sr.faellig = d.toISOString();
    sr.zuletzt = Store.now();
    Store.updateBlock(k.id, { sr });
    return sr;
  };

  const lernen = () => {
    const stapel = faellig();
    const alle = karten();

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder lern" style="width:min(620px,94vw)"></div>';
    document.body.appendChild(o);
    const box = o.querySelector('.lern');

    let i = 0, offen = false, gelernt = 0;

    const zeichne = () => {
      if (!alle.length) {
        box.innerHTML =
          '<div class="fh">🎴 Karteikarten</div>' +
          '<div style="padding:26px; text-align:center; color:var(--text-dim); font-size:14px; line-height:1.7">' +
          'Noch keine Karteikarten.<br>Tippe auf einer Seite <code>/karteikarte</code> —<br>' +
          'vorne die Frage, hinten die Antwort.</div>' +
          '<div class="fbtns"><button data-a="zu">Schliessen</button></div>';
        return;
      }
      if (i >= stapel.length) {
        box.innerHTML =
          '<div class="fh">🎴 Fertig für heute</div>' +
          `<div style="padding:26px; text-align:center; font-size:15px; line-height:1.8">` +
          `${gelernt} Karten wiederholt.<br>` +
          `<span style="color:var(--text-dim); font-size:13.5px">Insgesamt ${alle.length} Karten · ` +
          `nächste Wiederholung nach Plan</span></div>` +
          '<div class="fbtns"><button data-a="zu" class="prim">Schliessen</button></div>';
        return;
      }
      const k = stapel[i];
      const [vorn, hinten] = teileKarte(k);
      const quelle = Links.seiteVon(k.id);
      box.innerHTML =
        `<div class="fh">🎴 Karteikarte <em>${i + 1} / ${stapel.length}</em>` +
          `<button class="icon-btn" data-a="zu">✕</button></div>` +
        `<div class="karte">` +
          `<div class="k-vorn">${Blocks.inline(vorn)}</div>` +
          (offen ? `<hr><div class="k-hinten">${Blocks.inline(hinten)}</div>` : '') +
          (quelle ? `<div class="k-quelle" data-a="quelle">aus: ${esc(quelle.text || 'Ohne Titel')}</div>` : '') +
        `</div>` +
        (offen
          ? '<div class="fbtns lern-btns">' +
              '<button data-n="1">Nochmal</button><button data-n="2">Schwer</button>' +
              '<button data-n="3" class="prim">Gut</button><button data-n="4">Leicht</button>' +
            '</div>'
          : '<div class="fbtns"><button data-a="auf" class="prim">Antwort zeigen</button></div>');
    };
    zeichne();

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="auf"]')) { offen = true; zeichne(); return; }
      if (e.target.closest('[data-a="quelle"]')) {
        const k = stapel[i]; const q = Links.seiteVon(k.id);
        if (q) { o.remove(); App.oeffne(q.id); }
        return;
      }
      const n = e.target.closest('[data-n]');
      if (n) { planen(stapel[i], +n.dataset.n); gelernt++; i++; offen = false; zeichne(); }
    });

    document.addEventListener('keydown', function tast(e) {
      if (!document.body.contains(o)) { document.removeEventListener('keydown', tast); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!offen) { offen = true; zeichne(); } }
      if (offen && /^[1-4]$/.test(e.key)) { planen(stapel[i], +e.key); gelernt++; i++; offen = false; zeichne(); }
    });
  };

  const teileKarte = (k) => {
    const t = k.text || '';
    const i = t.indexOf('::');
    return i >= 0 ? [t.slice(0, i).trim(), t.slice(i + 2).trim()] : [t, '(noch keine Antwort — mit :: trennen)'];
  };

  /* ========================================================================
   * 6. VERSIONSVERLAUF   (Standard Notes, Trilium, Joplin)
   * ======================================================================*/
  const versionen = async (p) => {
    const liste = await Store.versionen(p.id);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">Versionsverlauf <em>${liste.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res">' +
          (liste.length ? liste.map(v =>
            `<button data-v="${v.id}">` +
              `<span>${esc(v.icon)}</span>` +
              `<span style="flex:1">${esc(v.titel)}` +
                `<span class="snip">${esc(new Date(v.zeit).toLocaleString('de-DE'))} · ${esc(v.anlass)}</span></span>` +
              `<span class="pth" data-a="zurueck" style="color:var(--accent);cursor:pointer">Wiederherstellen</span>` +
            '</button>').join('')
          : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
            'Noch keine gespeicherten Fassungen. Die App legt beim Bearbeiten automatisch welche an.</div>') +
        '</div>' +
        '<div class="fbtns"><button data-a="jetzt" class="prim">Jetzige Fassung sichern</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="jetzt"]')) {
        await Store.versionSpeichern(p.id, 'von Hand');
        o.remove(); UI.toast('Fassung gesichert'); versionen(p);
        return;
      }
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      const v = liste.find(x => x.id === b.dataset.v);
      if (!v) return;
      if (!confirm('Diese Fassung wiederherstellen? Der jetzige Inhalt wird vorher als Version gesichert.')) return;
      await Store.versionSpeichern(p.id, 'vor Wiederherstellung');
      Store.kinderLeeren(p.id);
      (v.daten.kinder || []).forEach(k => Store.baumEinfuegen(k, p.id));
      Store.updateBlock(p.id, { text: v.daten.text, icon: v.daten.icon });
      o.remove(); App.zeichneBaum(); App.zeichneSeite();
      UI.toast('Fassung wiederhergestellt');
    });
  };

  /* Alle paar Minuten beim Seitenwechsel automatisch eine Fassung sichern. */
  let letzteSicherung = {};
  const versionAutomatisch = async (pageId) => {
    if (!pageId) return;
    const p = Store.getBlock(pageId);
    if (!p || p.locked) return;
    const jetzt = Date.now();
    if (letzteSicherung[pageId] && jetzt - letzteSicherung[pageId] < 4 * 60 * 1000) return;
    letzteSicherung[pageId] = jetzt;
    await Store.versionSpeichern(pageId, 'automatisch');
  };

  /* ========================================================================
   * 7. SEITE VERSCHLÜSSELN   (Standard Notes, Notesnook, Trilium)
   * ------------------------------------------------------------------------
   * AES-GCM mit einem Schlüssel aus PBKDF2. Das Passwort wird nirgends
   * gespeichert — vergessen heisst wirklich weg.
   * ======================================================================*/
  const schluesselCache = new Map();

  const schluessel = async (pass, salzB64) => {
    const salz = Uint8Array.from(atob(salzB64), c => c.charCodeAt(0));
    const roh = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salz, iterations: 250000, hash: 'SHA-256' },
      roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };

  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const vonB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  const sperren = async (p) => {
    if (!crypto.subtle) { alert('Verschlüsselung braucht einen sicheren Kontext (https oder lokale Datei).'); return; }
    const pass = prompt('Passwort für diese Seite festlegen.\n\nAchtung: Ohne dieses Passwort ist der Inhalt endgültig weg.');
    if (!pass) return;
    const pass2 = prompt('Passwort zur Sicherheit noch einmal:');
    if (pass !== pass2) { alert('Die Passwörter stimmen nicht überein.'); return; }

    const salz = b64(crypto.getRandomValues(new Uint8Array(16)));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await schluessel(pass, salz);
    const klartext = JSON.stringify(Store.baum(p.id).kinder || []);
    const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(klartext));

    /* Vor dem Löschen prüfen, ob sich das Paket auch wirklich wieder öffnen lässt */
    try {
      const probe = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, chiffre);
      if (new TextDecoder().decode(probe) !== klartext) throw new Error('Probe fehlgeschlagen');
    } catch (err) { alert('Verschlüsselung fehlgeschlagen — es wurde nichts verändert.'); return; }

    Store.kinderLeeren(p.id);
    Store.updateBlock(p.id, { locked: { salz, iv: b64(iv), daten: b64(chiffre), zeit: Store.now() } });
    schluesselCache.delete(p.id);
    App.zeichneSeite(); App.zeichneBaum();
    UI.toast('Seite verschlüsselt');
  };

  const entsperren = async (p, passVorgabe) => {
    const l = p.locked;
    if (!l) return true;
    const pass = passVorgabe || prompt('Passwort dieser Seite:');
    if (!pass) return false;
    try {
      const k = await schluessel(pass, l.salz);
      const klar = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: vonB64(l.iv) }, k, vonB64(l.daten));
      const kinder = JSON.parse(new TextDecoder().decode(klar));
      Store.kinderLeeren(p.id);
      kinder.forEach(kd => Store.baumEinfuegen(kd, p.id));
      Store.updateBlock(p.id, { locked: null });
      App.zeichneSeite(); App.zeichneBaum();
      UI.toast('Seite entsperrt');
      return true;
    } catch (err) {
      UI.toast('Falsches Passwort');
      return false;
    }
  };

  /** Der Sperrbildschirm statt des Seiteninhalts. */
  const sperrAnsicht = (p, wrap) => {
    const d = document.createElement('div');
    d.className = 'gesperrt';
    d.innerHTML =
      '<div style="font-size:44px">🔒</div>' +
      '<div style="font-size:17px; margin:12px 0 4px">Diese Seite ist verschlüsselt</div>' +
      '<div style="font-size:13.5px; color:var(--text-dim); margin-bottom:16px">' +
        'Verschlüsselt am ' + esc(new Date(p.locked.zeit).toLocaleString('de-DE')) + '</div>' +
      '<input type="password" id="pw" placeholder="Passwort" autocomplete="off">' +
      '<button class="prim" id="auf">Entsperren</button>';
    wrap.appendChild(d);
    const inp = d.querySelector('#pw');
    const los = () => entsperren(p, inp.value);
    d.querySelector('#auf').addEventListener('click', los);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') los(); });
    setTimeout(() => inp.focus(), 50);
  };

  /* ========================================================================
   * 8. FOKUS-MODUS   (MarkText, Zettlr, iA Writer)
   * ======================================================================*/
  const fokus = (an) => {
    const jetzt = an === undefined ? !document.body.classList.contains('fokus') : an;
    document.body.classList.toggle('fokus', jetzt);
    UI.toast(jetzt ? 'Fokus-Modus — Esc beendet ihn' : 'Fokus-Modus beendet');
    if (jetzt) {
      const raus = (e) => {
        if (e.key === 'Escape') { fokus(false); document.removeEventListener('keydown', raus); }
      };
      document.addEventListener('keydown', raus);
    }
  };

  /* ========================================================================
   * 9. PRÄSENTATION   (HedgeDoc, Marp)
   * ------------------------------------------------------------------------
   * Jede Überschrift 1 oder jede Trennlinie beginnt eine neue Folie.
   * ======================================================================*/
  const praesentation = (p) => {
    const folien = [];
    let aktuell = { titel: p.text || '', bloecke: [] };

    /* Eine neue Folie beginnt bei einer Trennlinie und bei jeder
       Überschrift 1 oder 2 — so wie in HedgeDoc und Marp. */
    const trennt = (b) => b.type === 'divider' || b.type === 'h1' || b.type === 'h2';

    const sammle = (id, tiefe) => {
      Store.childrenOf(id).forEach(b => {
        if (trennt(b)) {
          const leerAmAnfang = !aktuell.bloecke.length && !folien.length && aktuell.titel === p.text;
          if (!leerAmAnfang) folien.push(aktuell);
          aktuell = { titel: b.type === 'divider' ? '' : (b.text || ''), bloecke: [] };
          return;
        }
        aktuell.bloecke.push({ b, tiefe });
        if (['bullet','number','todo','toggle'].includes(b.type)) sammle(b.id, tiefe + 1);
      });
    };
    sammle(p.id, 0);
    folien.push(aktuell);

    const o = document.createElement('div');
    o.className = 'praesi';
    document.body.appendChild(o);
    let i = 0;

    const zeichne = () => {
      const f = folien[i];
      o.innerHTML =
        '<div class="folie">' +
          (f.titel ? `<h1>${Blocks.inline(f.titel)}</h1>` : '') +
          f.bloecke.map(({ b, tiefe }) => folieBlock(b, tiefe)).join('') +
        '</div>' +
        `<div class="praesi-leiste">` +
          `<button data-a="vor">‹</button>` +
          `<span>${i + 1} / ${folien.length}</span>` +
          `<button data-a="zurueck">›</button>` +
          `<button data-a="zu">Beenden (Esc)</button>` +
        `</div>`;
    };

    const folieBlock = (b, tiefe) => {
      const ein = ` style="margin-left:${tiefe * 26}px"`;
      if (b.type === 'h1' || b.type === 'h2') return `<h2${ein}>${Blocks.inline(b.text || '')}</h2>`;
      if (b.type === 'h3') return `<h3${ein}>${Blocks.inline(b.text || '')}</h3>`;
      if (b.type === 'bullet') return `<li${ein}>${Blocks.inline(b.text || '')}</li>`;
      if (b.type === 'number') return `<li${ein} class="nr">${Blocks.inline(b.text || '')}</li>`;
      if (b.type === 'todo') return `<li${ein} class="td">${b.checked ? '☑' : '☐'} ${Blocks.inline(b.text || '')}</li>`;
      if (b.type === 'quote') return `<blockquote${ein}>${Blocks.inline(b.text || '')}</blockquote>`;
      if (b.type === 'code') return `<pre${ein}>${esc(b.text || '')}</pre>`;
      if (b.type === 'callout') return `<div class="cal"${ein}>${esc(b.icon || '💡')} ${Blocks.inline(b.text || '')}</div>`;
      if (b.type === 'image' && b.src) return `<img src="${esc(b.src)}" alt="">`;
      if (b.type === 'equation') return `<div class="eqp">${Zusatz.mathe(b.text || '')}</div>`;
      if (b.type === 'divider') return '<hr>';
      return b.text ? `<p${ein}>${Blocks.inline(b.text)}</p>` : '';
    };

    const weiter = (n) => { i = Math.max(0, Math.min(folien.length - 1, i + n)); zeichne(); };
    const tasten = (e) => {
      if (e.key === 'Escape') { schliessen(); return; }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); weiter(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); weiter(-1); }
      if (e.key === 'Home') weiter(-999);
      if (e.key === 'End') weiter(999);
    };
    const schliessen = () => {
      o.remove(); document.removeEventListener('keydown', tasten);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    o.addEventListener('click', e => {
      if (e.target.closest('[data-a="zu"]')) return schliessen();
      if (e.target.closest('[data-a="vor"]')) return weiter(-1);
      if (e.target.closest('[data-a="zurueck"]')) return weiter(1);
    });
    document.addEventListener('keydown', tasten);
    zeichne();
    o.requestFullscreen?.().catch(() => {});
  };

  /* ========================================================================
   * 10. MARKDOWN-QUELLTEXT   (MarkText, TUI Editor, Zettlr)
   * ------------------------------------------------------------------------
   * Die Seite als reiner Text — und zurück. Datenbanken bleiben dabei
   * unangetastet, sie stehen als Platzhalter drin.
   * ======================================================================*/
  const alsMarkdown = (p) => {
    const zeilen = [];
    const raus = (id, tiefe) => {
      Store.childrenOf(id).forEach(b => {
        const ein = '  '.repeat(tiefe);
        if (b.type === 'database') { zeilen.push(`<!--db:${b.id}-->`); return; }
        if (b.type === 'whiteboard') { zeilen.push(`<!--wb:${b.id}-->`); return; }
        if (b.type === 'chart') { zeilen.push(`<!--chart:${b.id}-->`); return; }
        if (b.type === 'table') { zeilen.push(`<!--tab:${b.id}-->`); return; }
        if (b.type === 'divider') { zeilen.push('---'); return; }
        if (b.type === 'code') { zeilen.push('```' + (b.lang || '')); zeilen.push(b.text || ''); zeilen.push('```'); return; }
        if (b.type === 'equation') { zeilen.push('$$' + (b.text || '') + '$$'); return; }
        if (b.type === 'image') { zeilen.push(`![${b.caption || ''}](${b.src || ''})`); return; }
        if (b.type === 'page') { zeilen.push(`${ein}[[${b.text || 'Ohne Titel'}]]`); return; }
        const marke = {
          h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '1. ',
          todo: b.checked ? '- [x] ' : '- [ ] ', quote: '> ', toggle: '> ',
          callout: '> 💡 ', flashcard: '?? '
        }[b.type] || '';
        zeilen.push(ein + marke + (b.text || ''));
        raus(b.id, tiefe + 1);
      });
    };
    raus(p.id, 0);
    return zeilen.join('\n');
  };

  /** Markdown zurück in Blöcke. Vorhandene Datenbanken werden erkannt. */
  const ausMarkdown = (p, text) => {
    const alteDbs = {};
    Store.childrenOf(p.id).forEach(b => {
      if (['database','whiteboard','chart','table'].includes(b.type)) alteDbs[b.id] = Store.baum(b.id);
    });

    Store.kinderLeeren(p.id);

    let imCode = false, codeText = [], codeLang = '';
    const zeilen = text.split('\n');

    zeilen.forEach(roh => {
      const platz = roh.trim().match(/^<!--(?:db|wb|chart|tab):([^>]+)-->$/);
      if (platz && alteDbs[platz[1]]) { Store.baumEinfuegen(alteDbs[platz[1]], p.id); return; }

      if (roh.trim().startsWith('```')) {
        if (imCode) {
          Store.addBlock(p.id, 'code', { text: codeText.join('\n'), lang: codeLang });
          imCode = false; codeText = []; codeLang = '';
        } else { imCode = true; codeLang = roh.trim().slice(3).trim(); }
        return;
      }
      if (imCode) { codeText.push(roh); return; }

      const z = roh.trim();
      if (!z) return;
      if (/^(---|\*\*\*|___)$/.test(z)) { Store.addBlock(p.id, 'divider'); return; }
      if (/^\$\$(.*)\$\$$/.test(z)) { Store.addBlock(p.id, 'equation', { text: z.slice(2, -2) }); return; }
      const bild = z.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
      if (bild) { Store.addBlock(p.id, 'image', { src: bild[2], caption: bild[1] }); return; }

      const m = z.match(/^(#{1,3})\s+(.*)$/);
      if (m) { Store.addBlock(p.id, ['h1','h2','h3'][m[1].length - 1], { text: m[2] }); return; }
      const todo = z.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
      if (todo) { Store.addBlock(p.id, 'todo', { text: todo[2], checked: todo[1].toLowerCase() === 'x' }); return; }
      if (/^[-*+]\s+/.test(z)) { Store.addBlock(p.id, 'bullet', { text: z.replace(/^[-*+]\s+/, '') }); return; }
      if (/^\d+\.\s+/.test(z)) { Store.addBlock(p.id, 'number', { text: z.replace(/^\d+\.\s+/, '') }); return; }
      if (/^>\s*💡\s*/.test(z)) { Store.addBlock(p.id, 'callout', { text: z.replace(/^>\s*💡\s*/, ''), icon: '💡' }); return; }
      if (/^>\s+/.test(z)) { Store.addBlock(p.id, 'quote', { text: z.replace(/^>\s+/, '') }); return; }
      if (/^\?\?\s+/.test(z)) { Store.addBlock(p.id, 'flashcard', { text: z.replace(/^\?\?\s+/, '') }); return; }
      Store.addBlock(p.id, 'text', { text: z });
    });
    if (imCode && codeText.length) Store.addBlock(p.id, 'code', { text: codeText.join('\n'), lang: codeLang });
  };

  const quelltext = (p) => {
    const md = alsMarkdown(p);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(820px,95vw)">' +
        '<div class="fh">Markdown-Quelltext <em>' + esc(p.text || 'Ohne Titel') + '</em>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<textarea id="mdq" spellcheck="false"></textarea>' +
        '<div class="fbtns">' +
          '<button data-a="kopieren">Kopieren</button>' +
          '<button data-a="datei">Als .md speichern</button>' +
          '<button data-a="ok" class="prim">Übernehmen</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    const ta = o.querySelector('#mdq');
    ta.value = md;
    ta.focus();

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="kopieren"]')) { navigator.clipboard?.writeText(ta.value); UI.toast('Kopiert'); }
      if (e.target.closest('[data-a="datei"]')) App.markdownExport(p);
      if (e.target.closest('[data-a="ok"]')) {
        if (ta.value !== md) {
          Store.versionSpeichern(p.id, 'vor Quelltext-Änderung');
          ausMarkdown(p, ta.value);
          App.zeichneSeite();
          UI.toast('Übernommen');
        }
        o.remove();
      }
    });
  };

  /* ========================================================================
   * 11. SCHREIBSTATISTIK   (Zettlr)
   * ======================================================================*/
  const statistik = (p) => {
    const sammle = (id, tiefe = 0) => {
      let t = '';
      Store.childrenOf(id).forEach(b => { t += ' ' + (b.text || ''); t += sammle(b.id, tiefe + 1); });
      return t;
    };
    const text = ((p.text || '') + ' ' + sammle(p.id)).trim();
    const woerter = text.split(/\s+/).filter(Boolean);
    const saetze = text.split(/[.!?]+\s/).filter(x => x.trim().length > 1);
    const zeichen = text.length;
    const lesezeit = Math.max(1, Math.round(woerter.length / 200));
    const sprechzeit = Math.max(1, Math.round(woerter.length / 130));
    const blockAnzahl = (function zaehl(id) {
      let n = 0; Store.childrenOf(id).forEach(b => { n += 1 + zaehl(b.id); }); return n;
    })(p.id);

    const stop = new Set(('der die das und oder aber ich du er sie es wir ihr in im an auf für mit von zu ist sind ' +
      'war waren ein eine einen einem eines dem den des nicht auch als wie wenn dann noch nur schon so bei um am').split(' '));
    const haeufig = {};
    woerter.forEach(w => {
      const k = w.toLowerCase().replace(/[^\wäöüß-]/g, '');
      if (k.length < 4 || stop.has(k)) return;
      haeufig[k] = (haeufig[k] || 0) + 1;
    });
    const top = Object.entries(haeufig).sort((a, b) => b[1] - a[1]).slice(0, 12);

    /* Ganzer Arbeitsbereich */
    const alleW = Object.values(Store.cache.blocks)
      .filter(b => b.alive).reduce((n, b) => n + (b.text || '').split(/\s+/).filter(Boolean).length, 0);

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(600px,94vw)">' +
        '<div class="fh">Statistik <em>' + esc(p.text || 'Ohne Titel') + '</em>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="stat-gitter">' +
          kachel(woerter.length, 'Wörter') + kachel(zeichen, 'Zeichen') +
          kachel(saetze.length, 'Sätze') + kachel(blockAnzahl, 'Blöcke') +
          kachel(lesezeit + ' min', 'Lesezeit') + kachel(sprechzeit + ' min', 'Vorlesezeit') +
        '</div>' +
        (top.length
          ? '<div class="stat-woerter"><div class="grp">Häufigste Wörter</div>' +
            top.map(([w, n]) => `<span class="tagpill">${esc(w)} <em>${n}</em></span>`).join('') + '</div>'
          : '') +
        `<div class="hint">Im ganzen Arbeitsbereich: ${alleW.toLocaleString('de-DE')} Wörter · ` +
        `${Links.seiten().length} Seiten</div>` +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) o.remove();
    });
  };

  const kachel = (wert, name) =>
    `<div class="stat-k"><b>${typeof wert === 'number' ? wert.toLocaleString('de-DE') : wert}</b><span>${name}</span></div>`;

  /* ========================================================================
   * 12. ERINNERUNGEN   (Notesnook, Notion @remind)
   * ======================================================================*/
  const erinnerungen = () => Store.getMeta('erinnerungen', []) || [];

  const erinnerungSetzen = (p) => {
    const jetzt = new Date(Date.now() + 60 * 60 * 1000);
    const vorgabe = jetzt.toISOString().slice(0, 16);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(460px,94vw)">' +
        '<div class="fh">Erinnerung</div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
          `<label style="font-size:13px; color:var(--text-dim)">Wann?<br>` +
          `<input type="datetime-local" id="ez" value="${vorgabe}" ` +
          `style="margin-top:6px; width:100%; padding:9px 10px; background:var(--bg-input); ` +
          `border:1px solid var(--line); border-radius:7px; outline:none"></label>` +
          `<label style="font-size:13px; color:var(--text-dim)">Text<br>` +
          `<input id="et" value="${esc(p.text || 'Erinnerung')}" ` +
          `style="margin-top:6px; width:100%; padding:9px 10px; background:var(--bg-input); ` +
          `border:1px solid var(--line); border-radius:7px; outline:none"></label>` +
          '<div style="font-size:12.5px; color:var(--text-faint)">Die Erinnerung meldet sich, solange diese App offen ist. ' +
          'Erlaubst du Benachrichtigungen, meldet sie sich auch im System.</div>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Erinnerung setzen</button>' +
        '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (!e.target.closest('[data-a="ok"]')) return;
      const zeit = o.querySelector('#ez').value;
      const text = o.querySelector('#et').value;
      if (!zeit) return;
      const liste = erinnerungen();
      liste.push({ id: Store.uid(), pageId: p.id, zeit, text, erledigt: false });
      Store.setMeta('erinnerungen', liste);
      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch {}
      }
      o.remove();
      UI.toast('Erinnerung gesetzt für ' + new Date(zeit).toLocaleString('de-DE'));
      App.zeichneSeite();
    });
  };

  const erinnerungenPruefen = () => {
    const liste = erinnerungen();
    let geaendert = false;
    const jetzt = Date.now();
    liste.forEach(e => {
      if (e.erledigt) return;
      if (new Date(e.zeit).getTime() > jetzt) return;
      e.erledigt = true; geaendert = true;
      UI.toast('⏰ ' + e.text);
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification('Erinnerung: ' + e.text, { body: 'In deinen Notizen', tag: e.id });
          n.onclick = () => { window.focus(); App.oeffne(e.pageId); };
        } catch {}
      }
    });
    if (geaendert) Store.setMeta('erinnerungen', liste);
  };

  /* ========================================================================
   * 13. ORDNER-ABGLEICH   (Joplin, Zettlr, SilverBullet)
   * ======================================================================*/
  const ordnerSchreiben = async () => {
    if (!window.showDirectoryPicker) {
      /* Fallback: alles in eine Markdown-Datei */
      const alles = Links.seiten().map(p => '# ' + (p.text || 'Ohne Titel') + '\n\n' + alsMarkdown(p)).join('\n\n---\n\n');
      lade(new Blob([alles], { type: 'text/markdown' }), 'notizen-alle-seiten.md');
      UI.toast('Dieser Browser kann keine Ordner öffnen — alles in eine Datei gespeichert');
      return;
    }
    try {
      const ordner = await window.showDirectoryPicker({ mode: 'readwrite' });
      let n = 0;
      const schreibe = async (verzeichnis, seite) => {
        const name = sauber(seite.text || 'Ohne Titel');
        const kinder = Store.childrenOf(seite.id).filter(k => k.type === 'page');
        const datei = await verzeichnis.getFileHandle(name + '.md', { create: true });
        const w = await datei.createWritable();
        await w.write('# ' + (seite.text || 'Ohne Titel') + '\n\n' + alsMarkdown(seite) + '\n');
        await w.close();
        n++;
        if (kinder.length) {
          const unter = await verzeichnis.getDirectoryHandle(name, { create: true });
          for (const k of kinder) await schreibe(unter, k);
        }
      };
      for (const p of Store.rootPages()) await schreibe(ordner, p);
      UI.toast(n + ' Seiten in den Ordner geschrieben');
    } catch (err) {
      if (err.name !== 'AbortError') UI.toast('Ordner konnte nicht beschrieben werden');
    }
  };

  const ordnerLesen = async () => {
    if (!window.showDirectoryPicker) {
      /* Fallback: einzelne Dateien auswählen */
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.md,.markdown,.txt'; inp.multiple = true;
      inp.addEventListener('change', async () => {
        let n = 0;
        for (const f of inp.files) { await mdDateiAnlegen(f.name, await f.text(), null); n++; }
        App.zeichneBaum(); UI.toast(n + ' Dateien eingelesen');
      });
      inp.click();
      return;
    }
    try {
      const ordner = await window.showDirectoryPicker();
      let n = 0;
      const lies = async (verzeichnis, elternId) => {
        for await (const [name, eintrag] of verzeichnis.entries()) {
          if (eintrag.kind === 'file' && /\.(md|markdown|txt)$/i.test(name)) {
            const f = await eintrag.getFile();
            await mdDateiAnlegen(name, await f.text(), elternId);
            n++;
          } else if (eintrag.kind === 'directory') {
            const p = Store.addPage(elternId, { text: name, icon: '📁' });
            await lies(eintrag, p.id);
          }
        }
      };
      await lies(ordner, null);
      App.zeichneBaum();
      UI.toast(n + ' Dateien eingelesen');
    } catch (err) {
      if (err.name !== 'AbortError') UI.toast('Ordner konnte nicht gelesen werden');
    }
  };

  const mdDateiAnlegen = async (dateiname, text, elternId) => {
    const zeilen = text.split('\n');
    let titel = dateiname.replace(/\.(md|markdown|txt)$/i, '');
    if (/^#\s+/.test(zeilen[0] || '')) { titel = zeilen[0].replace(/^#\s+/, '').trim(); zeilen.shift(); }
    const p = Store.addPage(elternId, { text: titel, icon: '📄' });
    ausMarkdown(p, zeilen.join('\n'));
    return p;
  };

  const sauber = (s) => String(s).replace(/[\/\\:*?"<>|]/g, '-').slice(0, 80).trim() || 'Seite';
  const lade = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ========================================================================
   * 14. ALLES ALS EINE HTML-DATEI   (TiddlyWiki)
   * ------------------------------------------------------------------------
   * Eine Datei, die alle Seiten enthält und ohne Server läuft. Zum Weitergeben,
   * Archivieren oder einfach als Sicherung, die man auch ohne diese App lesen kann.
   * ======================================================================*/
  const einzelDatei = () => {
    const seiten = Links.seiten();
    const daten = seiten.map(p => ({
      id: p.id, titel: p.text || 'Ohne Titel', icon: p.icon || '📄',
      eltern: p.parentId || null,
      html: seiteAlsHtml(p)
    }));

    const doc =
`<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notizen — Archiv</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
     background:#191919;color:#e9e9e7;display:flex;height:100vh;overflow:hidden}
#s{width:280px;background:#202020;border-right:1px solid #373737;overflow-y:auto;padding:14px}
#s h1{font-size:15px;margin-bottom:12px}
#s input{width:100%;padding:8px 10px;background:#2b2b2b;border:1px solid #373737;border-radius:6px;
         color:inherit;outline:none;font:inherit;font-size:13.5px;margin-bottom:10px}
#s a{display:block;padding:5px 8px;border-radius:5px;color:#9b9a97;text-decoration:none;font-size:14px;cursor:pointer}
#s a:hover,#s a.on{background:#2f2f2f;color:#e9e9e7}
#m{flex:1;overflow-y:auto;padding:44px 8vw 30vh}
h2{font-size:34px;margin-bottom:18px;letter-spacing:-.4px}
h3{font-size:24px;margin:22px 0 8px}h4{font-size:19px;margin:18px 0 6px}
p{margin:5px 0}li{margin-left:22px}blockquote{border-left:3px solid #666;padding-left:14px;margin:8px 0}
pre{background:#252525;padding:14px;border-radius:6px;overflow-x:auto;font-size:13.5px;margin:8px 0}
code{background:#252525;padding:1px 5px;border-radius:3px;font-size:13.5px}
hr{border:none;border-top:1px solid #373737;margin:14px 0}
table{border-collapse:collapse;margin:10px 0;font-size:14px}
td,th{border:1px solid #373737;padding:6px 9px;text-align:left}
.cal{background:#252525;border-radius:6px;padding:14px;margin:8px 0}
img{max-width:100%;border-radius:4px}
.tag{background:#454b4e;padding:1px 7px;border-radius:3px;font-size:12.5px}
@media(max-width:760px){body{flex-direction:column}#s{width:100%;height:180px}}
</style></head><body>
<div id="s"><h1>📓 Notizen</h1><input id="q" placeholder="Suchen …"><div id="nav"></div></div>
<div id="m"></div>
<script>
const D = ${JSON.stringify(daten)};
const nav = document.getElementById('nav'), m = document.getElementById('m');
const zeichneNav = (f='') => {
  nav.innerHTML = '';
  D.filter(p => !f || (p.titel+p.html).toLowerCase().includes(f.toLowerCase())).forEach(p => {
    const a = document.createElement('a');
    a.textContent = p.icon + ' ' + p.titel;
    a.onclick = () => oeffne(p.id);
    a.dataset.id = p.id;
    nav.appendChild(a);
  });
};
const oeffne = (id) => {
  const p = D.find(x => x.id === id); if (!p) return;
  m.innerHTML = '<h2>' + p.icon + ' ' + p.titel + '</h2>' + p.html;
  m.scrollTop = 0;
  [...nav.children].forEach(a => a.classList.toggle('on', a.dataset.id === id));
  location.hash = id;
};
document.getElementById('q').oninput = e => zeichneNav(e.target.value);
zeichneNav();
oeffne(location.hash.slice(1) || (D[0] && D[0].id));
<\/script></body></html>`;

    lade(new Blob([doc], { type: 'text/html' }), 'notizen-archiv-' + heute() + '.html');
    UI.toast(seiten.length + ' Seiten in eine HTML-Datei gepackt');
  };

  /** Eine Seite als HTML — für Archiv, Einzelexport und Drucken. */
  const seiteAlsHtml = (p) => {
    const raus = (id, tiefe) => {
      let h = '';
      Store.childrenOf(id).forEach(b => {
        const t = b.text || '';
        if (b.type === 'h1') h += `<h3>${Blocks.inline(t)}</h3>`;
        else if (b.type === 'h2') h += `<h4>${Blocks.inline(t)}</h4>`;
        else if (b.type === 'h3') h += `<h4>${Blocks.inline(t)}</h4>`;
        else if (b.type === 'bullet') h += `<li>${Blocks.inline(t)}</li>`;
        else if (b.type === 'number') h += `<li>${Blocks.inline(t)}</li>`;
        else if (b.type === 'todo') h += `<li>${b.checked ? '☑' : '☐'} ${Blocks.inline(t)}</li>`;
        else if (b.type === 'toggle') h += `<details open><summary>${Blocks.inline(t)}</summary>${raus(b.id, tiefe + 1)}</details>`;
        else if (b.type === 'quote') h += `<blockquote>${Blocks.inline(t)}</blockquote>`;
        else if (b.type === 'callout') h += `<div class="cal">${esc(b.icon || '💡')} ${Blocks.inline(t)}</div>`;
        else if (b.type === 'code') h += `<pre>${esc(t)}</pre>`;
        else if (b.type === 'equation') h += `<div>${Zusatz.mathe(t)}</div>`;
        else if (b.type === 'divider') h += '<hr>';
        else if (b.type === 'image' && b.src) h += `<img src="${esc(b.src)}" alt="${esc(b.caption || '')}">`;
        else if (b.type === 'table') h += tabelleHtml(b);
        else if (b.type === 'database') h += datenbankHtml(b);
        else if (b.type === 'page') h += `<p>📄 <b>${esc(t || 'Ohne Titel')}</b></p>`;
        else if (t) h += `<p>${Blocks.inline(t)}</p>`;
        if (b.type !== 'toggle') h += raus(b.id, tiefe + 1);
      });
      return h;
    };
    return raus(p.id, 0);
  };

  const tabelleHtml = (b) => {
    const rows = b.rows || [];
    return '<table>' + rows.map((z, i) => '<tr>' + z.map(c =>
      (b.kopfZeile !== false && i === 0) ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
  };

  const datenbankHtml = (b) => {
    const c = Store.getCollection(b.collectionId);
    if (!c) return '';
    const keys = Object.keys(c.schema);
    return `<p><b>${esc(c.name || 'Datenbank')}</b></p><table><tr>` +
      keys.map(k => `<th>${esc(c.schema[k].name)}</th>`).join('') + '</tr>' +
      Store.rowsOf(c.id).map(r => '<tr>' + keys.map(k =>
        `<td>${esc(Formula.anzeige(Datenbank.wert(r, k, c)))}</td>`).join('') + '</tr>').join('') +
      '</table>';
  };

  const htmlExport = (p) => {
    const doc = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(p.text || 'Seite')}</title>` +
      '<style>body{font:16px/1.65 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px}' +
      'pre{background:#f5f5f4;padding:14px;border-radius:6px;overflow-x:auto}code{background:#f5f5f4;padding:1px 5px;border-radius:3px}' +
      'blockquote{border-left:3px solid #ddd;padding-left:14px;color:#555}table{border-collapse:collapse}' +
      'td,th{border:1px solid #ddd;padding:6px 9px}.cal{background:#f5f5f4;padding:14px;border-radius:6px}' +
      'img{max-width:100%}</style></head><body>' +
      `<h1>${esc(p.icon || '')} ${esc(p.text || 'Ohne Titel')}</h1>` + seiteAlsHtml(p) + '</body></html>';
    lade(new Blob([doc], { type: 'text/html' }), sauber(p.text) + '.html');
    UI.toast('Als HTML gespeichert');
  };

  const drucken = (p) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0';
    document.body.appendChild(f);
    const d = f.contentDocument;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(p.text || 'Seite') + '</title>' +
      '<style>body{font:12pt/1.6 Georgia,serif;margin:22mm}h1{font-size:22pt}h3{font-size:16pt}h4{font-size:13pt}' +
      'pre{background:#f2f2f2;padding:10px;white-space:pre-wrap}table{border-collapse:collapse;width:100%}' +
      'td,th{border:1px solid #999;padding:5px 8px;font-size:10.5pt}img{max-width:100%}' +
      '.cal{background:#f2f2f2;padding:10px;border-radius:4px}</style></head><body>' +
      '<h1>' + esc(p.text || 'Ohne Titel') + '</h1>' + seiteAlsHtml(p) + '</body></html>');
    d.close();
    setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1000); }, 300);
  };

  /* ========================================================================
   * 15. VERSCHIEBEN NACH   (Notion „Move to")
   * ======================================================================*/
  const verschiebenNach = (p) => {
    const ziele = Links.seiten().filter(z => z.id !== p.id && !istUnter(z.id, p.id));
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<input id="vq" placeholder="Wohin verschieben? Seite suchen …" autocomplete="off">' +
        '<div class="res" id="vr"></div>' +
        '<div class="hint">Enter wählt · Esc bricht ab</div>' +
      '</div>';
    document.body.appendChild(o);
    const inp = o.querySelector('#vq'), res = o.querySelector('#vr');

    const zeichne = (q = '') => {
      const liste = ziele.filter(z => !q || (z.text || '').toLowerCase().includes(q.toLowerCase())).slice(0, 30);
      res.innerHTML =
        '<button data-id="__root"><span>🏠</span><span style="flex:1">Oberste Ebene</span></button>' +
        liste.map(z => `<button data-id="${z.id}"><span>${esc(z.icon || '📄')}</span>` +
          `<span style="flex:1">${esc(z.text || 'Ohne Titel')}</span>` +
          `<span class="pth">${esc(Store.pathOf(z.id).slice(0, -1).map(x => x.text).join(' / '))}</span></button>`).join('');
    };
    zeichne();
    inp.addEventListener('input', () => zeichne(inp.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') o.remove(); });
    res.addEventListener('click', e => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      const ziel = b.dataset.id === '__root' ? null : b.dataset.id;
      verschiebe(p, ziel);
      o.remove();
    });
    inp.focus();
  };

  const istUnter = (id, moeglicherElter) => {
    let cur = Store.getBlock(id), n = 0;
    while (cur && n++ < 50) {
      if (cur.parentId === moeglicherElter) return true;
      cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
    }
    return false;
  };

  const verschiebe = (p, zielId) => {
    const alt = Store.getBlock(p.parentId);
    if (alt) {
      alt.content = alt.content.filter(x => x !== p.id);
      Store.updateBlock(alt.id, { content: alt.content });
    }
    Store.updateBlock(p.id, { parentId: zielId });
    if (zielId) {
      const z = Store.getBlock(zielId);
      z.content = z.content || [];
      z.content.push(p.id);
      Store.updateBlock(z.id, { content: z.content, aufgeklappt: true });
    }
    App.zeichneBaum();
    App.zeichneSeite();
    UI.toast('Verschoben');
  };

  /* ========================================================================
   * 16. KLEINIGKEITEN
   * ======================================================================*/
  const alleToggles = () => {
    const bloecke = document.querySelectorAll('.b-toggle');
    const alleAuf = [...bloecke].every(b => b.classList.contains('open'));
    bloecke.forEach(b => {
      const id = b.dataset.bid;
      Store.updateBlock(id, { open: !alleAuf });
    });
    App.zeichneSeite();
  };

  const tastenkuerzel = () => {
    const G = [
      ['Allgemein', [
        ['Strg N', 'Neue Seite'], ['Strg P', 'Suchen'], ['Strg K', 'Suchen / Befehle'],
        ['Strg Shift P', 'Befehlspalette'], ['Strg [', 'Zurück'], ['Strg ]', 'Vorwärts'],
        ['Strg \\', 'Seitenleiste'], ['Strg Shift L', 'Hell / Dunkel'], ['Strg ,', 'Einstellungen'],
        ['Strg J', 'KI-Panel'], ['Strg F', 'Auf der Seite suchen'], ['Strg /', 'Diese Übersicht'],
        ['Esc', 'Menü oder Auswahl schliessen']
      ]],
      ['Blöcke', [
        ['/', 'Blockmenü'], ['Strg Alt 0-9', 'Blocktyp wechseln'], ['Tab', 'Einrücken'],
        ['Shift Tab', 'Ausrücken'], ['Strg D', 'Duplizieren'], ['Strg Shift ↑ ↓', 'Verschieben'],
        ['Strg Alt T', 'Alle Toggles auf/zu'], ['Strg Enter', 'Abhaken oder öffnen'],
        ['Shift Enter', 'Zeilenumbruch im Block'], ['Esc', 'Block auswählen']
      ]],
      ['Formatierung', [
        ['Strg B', 'Fett'], ['Strg I', 'Kursiv'], ['Strg U', 'Unterstrichen'],
        ['Strg Shift S', 'Durchgestrichen'], ['Strg E', 'Code'], ['Strg Shift H', 'Letzte Farbe'],
        ['Strg K', 'Link setzen (bei Auswahl)']
      ]],
      ['Verknüpfen', [
        ['[[', 'Seite verlinken'], ['@', 'Seite, Datum oder Person erwähnen'],
        ['#', 'Schlagwort'], ['((', 'Blockverweis'], [':', 'Emoji']
      ]],
      ['Werkzeuge', [
        ['Strg Shift J', 'Tagesjournal'], ['Strg Shift M', 'Schnellnotiz'],
        ['Strg Shift G', 'Graph'], ['Strg Shift T', 'Schlagwörter'],
        ['Strg Shift F', 'Fokus-Modus'], ['Strg Z', 'Rückgängig'], ['Strg Y', 'Wiederholen']
      ]]
    ];
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">Tastenkürzel<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="kuerzel">' + G.map(([g, liste]) =>
          `<div class="kb"><div class="grp">${g}</div>` + liste.map(([k, w]) =>
            `<div class="kz"><code>${esc(k)}</code><span>${esc(w)}</span></div>`).join('') + '</div>').join('') +
        '</div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-a="zu"]')) o.remove(); });
  };

  /* ========================================================================
   * ZUSATZEINTRÄGE IM SEITENMENÜ
   * ======================================================================*/
  const seitenMenueZusatz = (p) => (
    '<hr>' +
    '<button data-a="wz-vorlage"><span class="mi">🧩</span>Als Vorlage speichern</button>' +
    '<button data-a="wz-vorlage-ein"><span class="mi">＋</span>Aus Vorlage einfügen</button>' +
    '<button data-a="wz-verschieben"><span class="mi">➦</span>Verschieben nach …</button>' +
    '<button data-a="wz-versionen"><span class="mi">🕘</span>Versionsverlauf</button>' +
    '<button data-a="wz-erinnerung"><span class="mi">⏰</span>Erinnerung</button>' +
    '<hr>' +
    `<button data-a="wz-sperren"><span class="mi">🔒</span>${p.locked ? 'Entschlüsseln' : 'Verschlüsseln'}</button>` +
    `<button data-a="wz-gesperrt"><span class="mi">${p.gesperrt ? '🔓' : '🔏'}</span>` +
      `${p.gesperrt ? 'Bearbeiten erlauben' : 'Bearbeiten sperren'}</button>` +
    '<hr>' +
    '<button data-a="wz-fokus"><span class="mi">◎</span>Fokus-Modus<span class="ms">Strg Shift F</span></button>' +
    '<button data-a="wz-praesi"><span class="mi">▶</span>Präsentation</button>' +
    '<button data-a="wz-quelltext"><span class="mi">⌨</span>Markdown-Quelltext</button>' +
    '<button data-a="wz-statistik"><span class="mi">📊</span>Statistik</button>' +
    '<hr>' +
    '<button data-a="wz-html"><span class="mi">⭳</span>Als HTML</button>' +
    '<button data-a="wz-drucken"><span class="mi">🖨</span>Drucken / PDF</button>'
  );

  const seitenMenueAktion = (a, p) => {
    const karte = {
      'wz-vorlage': () => alsVorlage(p),
      'wz-vorlage-ein': () => vorlageEinfuegen(p),
      'wz-verschieben': () => verschiebenNach(p),
      'wz-versionen': () => versionen(p),
      'wz-erinnerung': () => erinnerungSetzen(p),
      'wz-sperren': () => p.locked ? entsperren(p) : sperren(p),
      'wz-gesperrt': () => {
        Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
        App.zeichneSeite();
        UI.toast(p.gesperrt ? 'Bearbeiten wieder erlaubt' : 'Seite gegen Bearbeiten gesperrt');
      },
      'wz-fokus': () => fokus(),
      'wz-praesi': () => praesentation(p),
      'wz-quelltext': () => quelltext(p),
      'wz-statistik': () => statistik(p),
      'wz-html': () => htmlExport(p),
      'wz-drucken': () => drucken(p)
    };
    if (!karte[a]) return false;
    karte[a]();
    return true;
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = () => {
    /* Erinnerungen alle halbe Minute prüfen */
    erinnerungenPruefen();
    setInterval(erinnerungenPruefen, 30000);

    document.addEventListener('keydown', e => {
      const strg = e.ctrlKey || e.metaKey;
      if (!strg) return;
      /* Hat der Editor die Taste schon behandelt (z. B. Kommentar am Block)? */
      if (e.defaultPrevented) return;
      const k = e.key.toLowerCase();
      if (e.shiftKey && k === 'p') { e.preventDefault(); palette(); return; }
      if (e.shiftKey && k === 'j') { e.preventDefault(); journal(); return; }
      if (e.shiftKey && k === 'm') { e.preventDefault(); schnellnotizen(); return; }
      if (e.shiftKey && k === 'g') { e.preventDefault(); Links.graph(); return; }
      if (e.shiftKey && k === 't') { e.preventDefault(); Links.tagRegister(); return; }
      if (e.shiftKey && k === 'f') { e.preventDefault(); fokus(); return; }
      if (e.altKey && k === 't')   { e.preventDefault(); alleToggles(); return; }
      if (k === '/')               { e.preventDefault(); tastenkuerzel(); return; }
    });
  };

  return {
    start, palette, befehle,
    journal, journalSeite, schnellnotizen, vorlagen, alsVorlage, vorlageEinfuegen, vorlagenListe,
    lernen, karten, faellig, teileKarte,
    versionen, versionAutomatisch, sperren, entsperren, sperrAnsicht,
    fokus, praesentation, quelltext, alsMarkdown, ausMarkdown, statistik,
    erinnerungSetzen, erinnerungen, ordnerSchreiben, ordnerLesen, einzelDatei,
    htmlExport, drucken, seiteAlsHtml, verschiebenNach, verschiebe,
    alleToggles, tastenkuerzel, systemSeite, datumLang, zeitKurz,
    seitenMenueZusatz, seitenMenueAktion
  };
})();

window.Werkzeuge = Werkzeuge;
