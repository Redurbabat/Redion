/* ============================================================================
 * pwa.js — Als App installieren
 * ----------------------------------------------------------------------------
 * Drei Dinge stecken hier drin:
 *
 *   1. SERVICE WORKER anmelden, damit die App offline startet, und melden,
 *      wenn eine neue Fassung bereitliegt.
 *   2. INSTALLIEREN anbieten. Android und Windows fragen von selbst; das
 *      iPhone tut das nicht — dort muss man den Weg zeigen.
 *   3. TELEFON-OBERFLÄCHE: Seitenleiste als Schublade, Knopf zum Aufklappen,
 *      Rand um die Kerbe herum.
 *
 * Auf dem iPhone geht das Installieren nur über Safari:
 *     Teilen-Knopf  →  „Zum Home-Bildschirm"
 * Danach läuft sie ohne Adresszeile, mit eigenem Symbol, und die Daten
 * bleiben erhalten — auch offline.
 * ==========================================================================*/

const PWA = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ------------------------------------------------------------------------
   * WAS FÜR EIN GERÄT IST DAS?
   * ----------------------------------------------------------------------*/
  const istApple = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const istSafari = () => /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  const istInstalliert = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const istTelefon = () => window.matchMedia('(max-width: 700px)').matches;

  /* ------------------------------------------------------------------------
   * SERVICE WORKER
   * ----------------------------------------------------------------------*/
  let neueFassung = null;

  const workerAnmelden = async () => {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;    /* von der Festplatte geht das nicht */
    try {
      const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });

      reg.addEventListener('updatefound', () => {
        const neu = reg.installing;
        if (!neu) return;
        neu.addEventListener('statechange', () => {
          if (neu.state === 'installed' && navigator.serviceWorker.controller) {
            neueFassung = neu;
            const b = UI.banner('Es liegt eine neue Fassung bereit. ' +
              '<button id="pwa-neu" style="text-decoration:underline">Jetzt laden</button>', 'info');
            b.querySelector('#pwa-neu')?.addEventListener('click', () => {
              neu.postMessage('aktualisieren');
              location.reload();
            });
          }
        });
      });

      let neugeladen = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (neugeladen) return;
        neugeladen = true;
      });
    } catch (e) {
      /* Kein Drama — die App läuft auch ohne. */
      console.info('Service Worker nicht angemeldet:', e.message);
    }
  };

  /* ------------------------------------------------------------------------
   * INSTALLIEREN
   * ----------------------------------------------------------------------*/
  let angebot = null;

  const angebotAnnehmen = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      angebot = e;
      knopfZeigen();
    });
    window.addEventListener('appinstalled', () => {
      angebot = null;
      Store.setMeta('pwa:installiert', true);
      document.getElementById('btn-install')?.remove();
      UI.toast('Fertig — Redion liegt jetzt als App auf dem Gerät.');
    });
  };

  const knopfZeigen = () => {
    if (istInstalliert() || document.getElementById('btn-install')) return;
    if (Store.getMeta('pwa:nichtFragen', false)) return;
    const fuss = document.querySelector('.side-fuss');
    if (!fuss) return;
    const b = document.createElement('button');
    b.className = 'side-item';
    b.id = 'btn-install';
    b.innerHTML = '<span>⬇</span><span>Als App installieren</span>';
    b.addEventListener('click', () => installieren());
    fuss.insertBefore(b, fuss.firstChild);
  };

  const installieren = async () => {
    if (angebot) {
      angebot.prompt();
      const { outcome } = await angebot.userChoice;
      angebot = null;
      if (outcome === 'accepted') UI.toast('Wird installiert …');
      else UI.toast('Abgebrochen — geht später auch noch.');
      return;
    }
    anleitung();
  };

  /* ------------------------------------------------------------------------
   * DIE ANLEITUNG — vor allem fürs iPhone
   * ----------------------------------------------------------------------*/
  const anleitung = () => {
    const apple = istApple();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(520px,94vw)">' +
      '<div class="fh">⬇ Als App installieren<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div style="padding:6px 18px 16px; max-height:70vh; overflow:auto">' +

      (istInstalliert()
        ? '<div class="meet-ok">✓ Läuft schon als App.</div>'
        : '') +

      (apple
        ? '<div class="verb-karte">' +
            '<div class="verb-kopf"><span>📱</span><b>iPhone und iPad</b></div>' +
            '<div class="verb-text">Apple lässt das Installieren nur über <b>Safari</b> zu — ' +
            'in Chrome oder Firefox auf dem iPhone gibt es den Punkt nicht.</div>' +
            '<ol class="pwa-schritte">' +
              '<li>Diese Seite in <b>Safari</b> öffnen</li>' +
              '<li>Unten auf den <b>Teilen-Knopf</b> tippen — das Quadrat mit dem Pfeil nach oben</li>' +
              '<li>In der Liste nach unten wischen bis <b>„Zum Home-Bildschirm"</b></li>' +
              '<li>Oben rechts auf <b>Hinzufügen</b></li>' +
            '</ol>' +
            '<div class="verb-text" style="margin-top:10px">Danach liegt Redion als eigenes ' +
            'Symbol auf dem Bildschirm, startet ohne Adresszeile und läuft auch ohne Netz. ' +
            'Deine Daten bleiben im App-Speicher.</div>' +
            (istSafari() ? '' :
              '<div class="meet-warn">Das hier ist nicht Safari. Öffne die Seite dort, ' +
              'sonst fehlt der Punkt „Zum Home-Bildschirm".</div>') +
          '</div>'
        : '<div class="verb-karte">' +
            '<div class="verb-kopf"><span>💻</span><b>Chrome, Edge und Android</b></div>' +
            '<div class="verb-text">Rechts in der Adresszeile erscheint ein kleines ' +
            'Installieren-Symbol. Oder über das Menü ⋮ → <b>App installieren</b>. ' +
            'Auf Android: ⋮ → <b>Zum Startbildschirm hinzufügen</b>.</div>' +
            (angebot ? '<div class="verb-knoepfe">' +
              '<button data-a="jetzt">Jetzt installieren</button></div>' : '') +
          '</div>') +

      '<div class="verb-karte">' +
        '<div class="verb-kopf"><span>🔌</span><b>Was offline geht</b></div>' +
        '<div class="verb-text">Alles, was auf dem Gerät liegt: Seiten, Datenbanken, ' +
        'Formeln, Ansichten, Suche, Vorlagen. Nur was von draussen kommt — Google-Kalender, ' +
        'Gmail, GitHub, Wikipedia — braucht Netz. Die KI läuft ohne Netz, wenn du ein ' +
        'Modell im Browser geladen hast.</div>' +
      '</div>' +

      '<div class="verb-karte">' +
        '<div class="verb-kopf"><span>💾</span><b>Bleiben die Daten?</b></div>' +
        '<div class="verb-text">Ja. Als installierte App räumt iOS den Speicher nicht ' +
        'von selbst weg — im normalen Safari-Tab kann das nach sieben Tagen ohne Besuch ' +
        'passieren. Genau deshalb lohnt sich das Installieren. Trotzdem gilt: ' +
        'ab und zu unter <b>Einstellungen → Import und Export</b> eine Sicherung ziehen.</div>' +
        '<div class="verb-knoepfe"><button data-a="dauerhaft">Speicher dauerhaft anfordern</button>' +
        '<button data-a="sichern">Jetzt sichern</button></div>' +
      '</div>' +

      '</div><div class="fbtns">' +
      '<button data-a="nie">Nicht mehr fragen</button>' +
      '<button data-a="zu" class="prim">Fertig</button></div></div>';
    document.body.appendChild(o);

    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'jetzt') { o.remove(); installieren(); }
      if (b.dataset.a === 'nie') {
        Store.setMeta('pwa:nichtFragen', true);
        document.getElementById('btn-install')?.remove();
        o.remove(); UI.toast('Gut — der Punkt steht weiter in den Einstellungen.');
      }
      if (b.dataset.a === 'dauerhaft') {
        if (navigator.storage?.persist) {
          const ok = await navigator.storage.persist();
          UI.toast(ok ? '✓ Der Browser behält die Daten dauerhaft.'
                      : 'Der Browser hat das abgelehnt — Sicherungen helfen trotzdem.');
        } else UI.toast('Dieser Browser kennt die Anfrage nicht.');
      }
      if (b.dataset.a === 'sichern') { o.remove(); App.sicherungSpeichern(); }
    });
  };

  /* ------------------------------------------------------------------------
   * TELEFON-OBERFLÄCHE
   * ------------------------------------------------------------------------
   * Auf einem Telefon ist für eine feste Seitenleiste kein Platz. Sie wird
   * zur Schublade, die über einen Knopf hereinfährt und beim Tippen daneben
   * wieder verschwindet.
   * ----------------------------------------------------------------------*/
  const schubladeAuf = () => {
    document.body.classList.add('side-offen');
    if (!document.getElementById('side-schatten')) {
      const s = document.createElement('div');
      s.id = 'side-schatten';
      s.addEventListener('click', schubladeZu);
      document.body.appendChild(s);
    }
  };
  const schubladeZu = () => {
    document.body.classList.remove('side-offen');
    document.getElementById('side-schatten')?.remove();
  };

  /* ------------------------------------------------------------------------
   * FORMATLEISTE ÜBER DER TASTATUR
   * ------------------------------------------------------------------------
   * Auf dem Telefon gibt es keine Tastenkürzel und keine Blockgriffe. Notion
   * löst das mit einer Leiste über der Tastatur. Genauso hier: sie erscheint,
   * sobald man in einen Block tippt, und verschwindet, wenn man fertig ist.
   * --------------------------------------------------------------------- */
  const tastenleiste = () => {
    const leiste = document.getElementById('tastenleiste');
    if (!leiste) return;
    let aktiv = null;                       /* das Feld, in dem geschrieben wird */

    const zeigen = (feld) => {
      if (!istTelefon()) return;
      aktiv = feld;
      leiste.hidden = false;
      document.body.classList.add('schreibt');
    };
    const verstecken = () => {
      leiste.hidden = true;
      document.body.classList.remove('schreibt');
      aktiv = null;
    };

    document.addEventListener('focusin', (e) => {
      const ct = e.target.closest('.blk [contenteditable], #title');
      if (ct) zeigen(ct); else if (!e.target.closest('#tastenleiste')) verstecken();
    });
    document.addEventListener('focusout', (e) => {
      /* Ein Klick auf die Leiste selbst darf sie nicht schliessen */
      setTimeout(() => {
        if (!document.activeElement ||
            !document.activeElement.closest('.blk [contenteditable], #title, #tastenleiste'))
          verstecken();
      }, 120);
    });

    /* mousedown statt click: so verliert das Textfeld den Fokus nicht */
    leiste.addEventListener('mousedown', (e) => e.preventDefault());
    leiste.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) e.preventDefault();
    }, { passive: false });

    leiste.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      const was = b.dataset.t;
      const feld = aktiv;
      if (was === 'fertig') { feld && feld.blur(); verstecken(); return; }
      if (!feld) return;
      feld.focus();

      const blk = feld.closest('.blk');
      const block = blk ? Store.getBlock(blk.dataset.bid) : null;

      /* Text einsetzen, wo der Schreibzeiger steht */
      const einsetzen = (txt) => document.execCommand('insertText', false, txt);

      if (was === 'plus') {
        if (!block) return;
        const eltern = Store.getBlock(block.parentId);
        const idx = eltern ? eltern.content.indexOf(block.id) + 1 : -1;
        const neu = Store.addBlock(block.parentId, 'text', {}, idx);
        App.zeichneSeite(neu.id);
        return;
      }
      if (was === 'slash') { einsetzen('/');
        feld.dispatchEvent(new InputEvent('input', { bubbles: true }));
        setTimeout(() => Blocks.slashMenue(feld, block), 30); return; }
      if (was === 'fett')   { einsetzenUm(feld, '**'); return; }
      if (was === 'kursiv') { einsetzenUm(feld, '*');  return; }
      if (was === 'unter')  { einsetzenUm(feld, '__'); return; }
      if (was === 'code')   { einsetzenUm(feld, '`');  return; }
      if (was === 'link') {
        const u = prompt('Adresse für den Link:');
        if (!u) return;
        const t = (getSelection().toString() || u);
        einsetzen('[' + t + '](' + u + ')');
        return;
      }
      if (was === 'todo' && block) {
        Store.updateBlock(block.id, { type: block.type === 'todo' ? 'text' : 'todo' });
        App.zeichneSeite(block.id, 'ende');
        return;
      }
      if ((was === 'rein' || was === 'raus') && block) {
        feld.dispatchEvent(new KeyboardEvent('keydown',
          { key: 'Tab', shiftKey: was === 'raus', bubbles: true, cancelable: true }));
        return;
      }
    });
  };

  /** Setzt Zeichen um die Auswahl — dieselbe Wirkung wie Strg+B am Rechner. */
  const einsetzenUm = (feld, zeichen) => {
    const sel = getSelection();
    const txt = sel && sel.toString();
    if (txt) document.execCommand('insertText', false, zeichen + txt + zeichen);
    else {
      document.execCommand('insertText', false, zeichen + zeichen);
      /* Schreibzeiger in die Mitte stellen */
      const r = sel.getRangeAt(0);
      r.setStart(r.startContainer, Math.max(0, r.startOffset - zeichen.length));
      r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r);
    }
    feld.dispatchEvent(new InputEvent('input', { bubbles: true }));
  };

  /* ------------------------------------------------------------------------
   * LANGES DRÜCKEN UND WISCHEN
   * ------------------------------------------------------------------------
   * Am Telefon gibt es keine Griffe neben den Blöcken — Notion ersetzt sie
   * durch langes Drücken. Und in Listen wischt man: nach rechts abhaken,
   * nach links archivieren. Beides mit Rückgängig.
   * --------------------------------------------------------------------- */
  const beruehrung = () => {
    let halten = null, startX = 0, startY = 0, gezogen = null, verschoben = 0;

    const aufraeumen = () => {
      clearTimeout(halten); halten = null;
      if (gezogen) { gezogen.style.transform = ''; gezogen.style.opacity = ''; gezogen = null; }
      verschoben = 0;
    };

    document.addEventListener('touchstart', (e) => {
      if (!istTelefon() || e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;

      /* Langes Drücken auf einem Block öffnet sein Menü */
      const blk = e.target.closest('.blk');
      if (blk && !e.target.closest('#tastenleiste, .handles')) {
        halten = setTimeout(() => {
          const b = Store.getBlock(blk.dataset.bid);
          if (!b) return;
          const griff = blk.querySelector('.handles button[data-act="menu"]');
          if (navigator.vibrate) navigator.vibrate(12);
          Blocks.blockMenue(griff || blk, b);
          halten = null;
        }, 500);
      }

      /* Wischen auf einer Aufgabe oder Datenbankzeile */
      const zeile = e.target.closest('tbody tr[data-rid], .blk.b-todo, .liste-zeile[data-rid]');
      if (zeile && !e.target.closest('input, [contenteditable]')) gezogen = zeile;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!istTelefon() || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      /* Sobald der Finger wandert, ist es kein langes Drücken mehr */
      if (halten && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) { clearTimeout(halten); halten = null; }
      if (!gezogen) return;
      if (Math.abs(dy) > Math.abs(dx)) { aufraeumen(); return; }   /* senkrecht = scrollen */
      verschoben = Math.max(-120, Math.min(120, dx));
      gezogen.style.transform = 'translateX(' + verschoben + 'px)';
      gezogen.style.opacity = String(1 - Math.abs(verschoben) / 260);
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (halten) { clearTimeout(halten); halten = null; }
      if (!gezogen) return;
      const el = gezogen, weg = verschoben;
      el.style.transition = 'transform .18s ease, opacity .18s ease';
      el.style.transform = ''; el.style.opacity = '';
      setTimeout(() => { el.style.transition = ''; }, 200);
      gezogen = null; verschoben = 0;
      if (Math.abs(weg) < 70) return;

      /* Nach rechts: abhaken. Nach links: archivieren. */
      const rid = el.dataset.rid;
      if (rid) {
        const row = Store.getBlock(rid);
        if (!row) return;
        if (weg < 0) {
          Store.updateBlock(rid, { archiviert: !row.archiviert });
          App.zeichneSeite();
          UI.toast(row.archiviert ? 'Zurückgeholt' : 'Archiviert — nochmal wischen holt es zurück');
        } else {
          /* Erste Kontrollkästchen-Spalte umschalten */
          const coll = Store.getCollection(row.parentId);
          const k = coll && Object.keys(coll.schema).find(x => coll.schema[x].type === 'checkbox');
          if (!k) { UI.toast('Hier gibt es nichts zum Abhaken'); return; }
          Store.setProp(rid, k, !(row.props || {})[k]);
          App.zeichneSeite();
          UI.toast((row.props || {})[k] ? 'Häkchen weg' : '✓ Abgehakt');
        }
        return;
      }
      const b = el.dataset.bid && Store.getBlock(el.dataset.bid);
      if (b && b.type === 'todo') {
        if (weg > 0) { Store.updateBlock(b.id, { checked: !b.checked }); App.zeichneSeite();
                       UI.toast(b.checked ? 'Häkchen weg' : '✓ Erledigt'); }
        else { Store.trashBlock(b.id); App.zeichneSeite();
               UI.toast('Gelöscht — im Papierkorb'); }
      }
    }, { passive: true });

    document.addEventListener('touchcancel', aufraeumen, { passive: true });
  };

  const telefonOberflaeche = () => {
    tastenleiste();
    beruehrung();
    /* Knopf zum Aufklappen in die Kopfzeile */
    if (!document.getElementById('btn-menu')) {
      const b = document.createElement('button');
      b.className = 'top-btn schmal nur-telefon';
      b.id = 'btn-menu';
      b.title = 'Seitenleiste';
      b.textContent = '☰';
      b.addEventListener('click', () =>
        document.body.classList.contains('side-offen') ? schubladeZu() : schubladeAuf());
      document.getElementById('topbar')?.prepend(b);
    }

    /* Beim Öffnen einer Seite schliesst sich die Schublade wieder */
    const altOeffne = App.oeffne;
    App.oeffne = function (...a) {
      const r = altOeffne.apply(App, a);
      if (istTelefon()) schubladeZu();
      return r;
    };

    /* Von links hereinwischen öffnet, nach links wischen schliesst */
    let startX = 0, startY = 0, zieht = false;
    document.addEventListener('touchstart', (e) => {
      if (!istTelefon()) return;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      zieht = startX < 26 || document.body.classList.contains('side-offen');
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!zieht || !istTelefon()) return;
      zieht = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX, dy = Math.abs(t.clientY - startY);
      if (dy > 60) return;
      if (dx > 70) schubladeAuf();
      if (dx < -70) schubladeZu();
    }, { passive: true });

    /* Die echte Höhe des Fensters — iOS zählt die Adressleiste sonst mit */
    const hoehe = () => document.documentElement.style
      .setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    hoehe();
    window.addEventListener('resize', hoehe);
    window.addEventListener('orientationchange', () => setTimeout(hoehe, 250));
  };

  /* ------------------------------------------------------------------------
   * ABKÜRZUNGEN AUS DEM APP-SYMBOL
   * ----------------------------------------------------------------------*/
  const abkuerzung = () => {
    const h = (location.hash || '').replace('#', '');
    if (!h) return;
    const tun = {
      neu:     () => App.neueSeite(),
      suche:   () => App.suche(),
      journal: () => Werkzeuge.journal(),
      meeting: () => Meeting.panel()
    }[h];
    if (!tun) return;
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(tun, 400);
  };

  /* Ein geteilter Link vom Telefon landet direkt in der Sammlung. */
  const geteiltes = () => {
    const p = new URLSearchParams(location.search);
    const adresse = p.get('adresse'), titel = p.get('titel'), text = p.get('text');
    if (!adresse && !text) return;
    history.replaceState(null, '', location.pathname);
    const r = Clipper.ablegen({
      url: adresse || '', titel: titel || adresse || 'Geteilt',
      auswahl: text || '', kurz: text || ''
    });
    App.zeichneBaum();
    App.oeffne(r.id);
    UI.toast('Geteiltes gespeichert');
  };

  /* ------------------------------------------------------------------------
   * VERBINDUNGSANZEIGE
   * ------------------------------------------------------------------------
   * Redion braucht das Netz nur für KI, Karten und Webhooks. Trotzdem soll
   * man sehen, woran man ist: ein Streifen, wenn die Verbindung weg ist,
   * und die ehrliche Auskunft, was jetzt trotzdem geht.
   * ---------------------------------------------------------------------- */
  const NUR_MIT_NETZ = ['KI-Antworten aus der Wolke', 'Karten von OpenStreetMap',
                        'Webhooks und E-Mail', 'Kalender-Abgleich', 'Wikipedia'];

  const verbindungAnzeigen = (drin) => {
    document.getElementById('offline-streifen')?.remove();
    if (drin) return;
    const d = document.createElement('div');
    d.id = 'offline-streifen';
    d.innerHTML = '<span>⚡ Ohne Verbindung — alles Eigene läuft weiter</span>' +
                  '<button data-a="was">Was geht jetzt nicht?</button>' +
                  '<button data-a="zu" title="Ausblenden">✕</button>';
    d.addEventListener('click', e => {
      if (e.target.closest('[data-a="zu"]')) { d.remove(); return; }
      if (!e.target.closest('[data-a="was"]')) return;
      const r = e.target.getBoundingClientRect();
      UI.menu('<div class="grp">Braucht eine Verbindung</div>' +
        NUR_MIT_NETZ.map(x => `<button><span class="mi">⚠</span>${x}</button>`).join('') +
        '<hr><div class="grp">Läuft weiter</div>' +
        ['Schreiben und Lesen', 'Datenbanken, Filter, Formeln', 'Suche und Vorlagen',
         'Sicherung als Datei', 'Automationen im Gerät']
          .map(x => `<button><span class="mi">✓</span>${x}</button>`).join(''),
        Math.max(10, r.left - 120), r.bottom + 6);
    });
    document.body.appendChild(d);
  };

  const verbindungUeberwachen = () => {
    verbindungAnzeigen(navigator.onLine);
    addEventListener('online',  () => { verbindungAnzeigen(true);  UI.toast('Verbindung ist wieder da'); });
    addEventListener('offline', () => { verbindungAnzeigen(false); });
  };

  const start = () => {
    workerAnmelden();
    angebotAnnehmen();
    telefonOberflaeche();
    verbindungUeberwachen();
    setTimeout(() => { abkuerzung(); geteiltes(); }, 500);
    /* Auf dem iPhone gibt es kein Angebot vom Browser — also selbst anbieten. */
    if (istApple() && !istInstalliert()) setTimeout(knopfZeigen, 1500);
  };

  return { start, installieren, anleitung, istInstalliert, istApple, istTelefon, tastenleiste,
           schubladeAuf, schubladeZu, knopfZeigen,
           verbindungAnzeigen, verbindungUeberwachen, NUR_MIT_NETZ };
})();

window.PWA = PWA;
