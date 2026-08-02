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
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
      UI.toast('Fertig — Notizen liegt jetzt als App auf dem Gerät.');
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
            '<div class="verb-text" style="margin-top:10px">Danach liegt Notizen als eigenes ' +
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

  const telefonOberflaeche = () => {
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

  const start = () => {
    workerAnmelden();
    angebotAnnehmen();
    telefonOberflaeche();
    setTimeout(() => { abkuerzung(); geteiltes(); }, 500);
    /* Auf dem iPhone gibt es kein Angebot vom Browser — also selbst anbieten. */
    if (istApple() && !istInstalliert()) setTimeout(knopfZeigen, 1500);
  };

  return { start, installieren, anleitung, istInstalliert, istApple, istTelefon,
           schubladeAuf, schubladeZu, knopfZeigen };
})();

window.PWA = PWA;
