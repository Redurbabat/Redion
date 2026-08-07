/* ============================================================================
 * schale/aufbau/seitenleiste.js — die linke Leiste, für sich allein
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/seitenleiste.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/seitenleiste.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Sie lag bis hierher mitten in `schale.js`, zwischen Routing, Seitenmenü,
 * Suche und Start. Das ist die Datei, in der alles zusammenläuft — und genau
 * deshalb war sie der falsche Ort: wer an der Seitenleiste etwas ändern
 * wollte, musste 2600 Zeilen aufmachen und hoffen, die richtige Stelle zu
 * treffen.
 *
 * Hier steht jetzt alles, was die Leiste ausmacht, und sonst nichts:
 *
 *   ABSCHNITTE          welche es gibt, ein- und ausblendbar wie bei Notion
 *   die Reihenfolge     umsortierbar — Notion kann das nicht
 *   das Auf- und Zuklappen, je Abschnitt gemerkt
 *   die Reiter          Start · Chat · Besprechungen, am PC und am Telefon
 *   zeichne()           der Baum: Werkzeuge, Agenten, Kürzlich, Favoriten,
 *                       Bereiche, Privat, Meine Apps und was das Register
 *                       beisteuert
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. `ordne`, das `setTimeout(…, 0)` am Ende von `zeichne` und `abschnitt()`
 *    gehören zusammen. Die ersten beiden arbeiten auf dem **fertigen** DOM und
 *    lesen den Namen aus `span.firstChild.textContent` — also aus genau der
 *    Form, die `abschnitt()` erzeugt. Wer eines davon ändert, ändert alle
 *    drei, sonst bricht die Sortierung still.
 *
 * 2. Diese Datei ruft `App` nicht. Was sie von dort braucht, bekommt sie über
 *    `binde({ … })` gereicht — einmal in `App.start()`, vor dem ersten
 *    Zeichnen. Das ist kein Selbstzweck: solange die Leiste `App` kennt und
 *    `App` die Leiste, lässt sich keines von beiden allein prüfen.
 *
 * 3. `App.zeichneBaum` bleibt als Name bestehen — er steht an über fünfzig
 *    Stellen im Projekt. Er reicht nur noch hierher weiter, genau wie `UI` es
 *    für `Menue`, `Hinweis` und `Dialog` tut.
 * ==========================================================================*/

const Seitenleiste = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  /* Eigenes `esc` statt eingespeistem — so hält es auch `aufbau/reiter.js`.
     Drei Zeilen doppelt sind billiger als eine Abhängigkeit mehr. */
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ------------------------------------------------------------------------
   * WAS VON AUSSEN KOMMT
   * Sieben Dinge braucht die Leiste, die ihr nicht gehören: das Öffnen einer
   * Seite, die aktuelle Seite, die Listen „Kürzlich" und „Kommende Termine",
   * das Seitenmenü, die Suche und den Papierkorb. Sie kommen über `binde`.
   *
   * Fehlt eines, sagt der Fehler, was fehlt und wohin es gehört. Ein
   * `undefined is not a function` mitten im Zeichnen hätte niemandem gesagt,
   * dass jemand `binde` vergessen hat.
   * ----------------------------------------------------------------------*/
  let gebunden: Record<string, any> = {};

  const braucht = (name: string) => (...args: any[]) => {
    const fn = gebunden[name];
    if (typeof fn !== 'function') {
      throw new Error('Die Seitenleiste wurde ohne „' + name + '" gebunden. ' +
        'Seitenleiste.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
    }
    return fn(...args);
  };

  const binde = (teile: any) => { gebunden = Object.assign({}, gebunden, teile || {}); };

  const oeffne          = braucht('oeffne');
  const aktuelleSeite   = braucht('aktuelleSeite');
  const kuerzlich       = braucht('kuerzlich');
  const kommendeTermine = braucht('kommendeTermine');
  const seitenMenue     = braucht('seitenMenue');
  const suche           = braucht('suche');
  const papierkorb      = braucht('papierkorb');

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

  const abschnittAn = (id: string) => !(Store.getMeta('sidebarAus', []) || []).includes(id);

  /** Die Abschnitte in der selbst gewählten Reihenfolge. Notion lässt sie
      nur ein- und ausblenden, nicht umsortieren. */
  const abschnitteGeordnet = () => {
    const folge = Store.getMeta('sidebarFolge', null);
    if (!Array.isArray(folge) || !folge.length) return ABSCHNITTE;
    const nach: any[] = [];
    folge.forEach(id => { const a = ABSCHNITTE.find(x => x[0] === id); if (a) nach.push(a); });
    ABSCHNITTE.forEach(a => { if (!nach.includes(a)) nach.push(a); });
    return nach;
  };

  const abschnittSchieben = (id: string, richtung: any) => {
    const folge = abschnitteGeordnet().map(x => x[0]);
    const i = folge.indexOf(id);
    const j = i + richtung;
    if (i < 0 || j < 0 || j >= folge.length) return;
    [folge[i], folge[j]] = [folge[j], folge[i]];
    Store.setMeta('sidebarFolge', folge);
    zeichneBaum();
  };

  const abschnittSchalten = (id: string) => {
    const aus = Store.getMeta('sidebarAus', []) || [];
    Store.setMeta('sidebarAus', aus.includes(id) ? aus.filter((x: any) => x !== id) : [...aus, id]);
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
    leiste.querySelectorAll<HTMLElement>('.sr').forEach(b => {
      b.classList.toggle('on', b.dataset.reiter === reiter);
    });
    /* Die untere Leiste am Telefon zeigt dieselben Bereiche — sie muss
       mitgehen, sonst stimmt an einem der beiden Orte die Markierung nicht. */
    if (typeof handyLeiste === 'function') handyLeiste();
  };

  let reiter = 'start';

  /* Beim allerersten Setzen darf die Pille nicht gleiten. Sonst schiebt
     sie sich beim Öffnen der App von der linken Kante herein — eine
     Bewegung ohne Anlass, und die liest sich als Fehler. */
  let pilleGesetzt = false;

  /**
   * DIE GLEITENDE PILLE UNTER DEN REITERN.
   *
   * Sie ist der Hintergrund der aktiven Pille, aber als eigenes Feld: statt
   * an einer Stelle zu verschwinden und an der nächsten aufzutauchen,
   * wandert sie hinüber. Das Auge folgt der Bewegung und ist beim Ankommen
   * schon dort — ein Sprung dagegen muss erst wieder gesucht werden.
   *
   * ZWEI DINGE, DIE HIER LEICHT SCHIEFGEHEN:
   *
   *   1. GEMESSEN WIRD NACH DEM SETZEN VON `.an`. Die aktive Pille zeigt
   *      als einzige ihre Beschriftung und ist deshalb breiter als vorher.
   *      Wer vorher misst, bekommt die alte Breite und die Pille endet
   *      einen Zentimeter zu kurz.
   *
   *   2. DIE LEISTE ROLLT SEITWÄRTS. `offsetLeft` zählt vom Anfang des
   *      Inhalts, nicht vom Bildrand — und genau das wird gebraucht: die
   *      Pille liegt IN der rollenden Leiste und rollt mit. Wer hier
   *      `getBoundingClientRect()` nähme, hätte die Pille an der richtigen
   *      Stelle des Bildschirms und an der falschen des Inhalts.
   */
  const pilleSchieben = (l: HTMLElement, aktiv: HTMLElement | null) => {
    const pille = l.querySelector<HTMLElement>('#ho-pille');
    if (!pille) return;

    /* „Mehr" und „Kompass" haben oben keinen Reiter (E42). Dann gehört
       auch keine Pille irgendwohin — sie bleibt, wo sie war, und
       verschwindet. Sie an den Anfang zu schieben wäre eine Aussage, und
       zwar eine falsche. */
    if (!aktiv) { pille.style.opacity = '0'; return; }

    const x = aktiv.offsetLeft;
    const b = aktiv.offsetWidth;
    const y = aktiv.offsetTop;
    if (!b) return;                      /* Leiste unsichtbar — am Rechner */

    if (!pilleGesetzt) pille.classList.add('stumm');
    pille.style.transform = `translateX(${x}px)`;
    pille.style.width = b + 'px';
    pille.style.top = y + 'px';
    pille.style.opacity = '1';

    if (!pilleGesetzt) {
      /* Die Sperre erst im nächsten Bild lösen, sonst gilt sie für die
         eben gesetzten Werte schon nicht mehr. */
      pilleGesetzt = true;
      requestAnimationFrame(() => requestAnimationFrame(() =>
        pille.classList.remove('stumm')));
    }

    /* Steht der neue Reiter halb ausserhalb, ihn hereinholen. Bei 390 px
       passen die fünf Wege nicht alle ins Bild; ohne das tippt man auf
       „Mehr" und sieht danach nicht, dass man dort ist. */
    const links = x - l.scrollLeft;
    if (links < 0 || links + b > l.clientWidth) {
      const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
      l.scrollTo({ left: Math.max(0, x - 16), behavior: ruhig ? 'auto' : 'smooth' });
    }
  };

  /**
   * Die untere Leiste am Telefon markieren und den Punkt am Posteingang
   * setzen. Wird bei jedem Wechsel und nach jedem Zeichnen aufgerufen —
   * eine Leiste, die nicht zeigt, wo man ist, ist nur eine Knopfreihe.
   */
  const handyLeiste = () => {
    const l = document.getElementById('handy-oben');
    if (!l) return;
    /* `chat` hat oben keinen Reiter mehr (E38) — die Zeile bleibt trotzdem
       stehen, damit die Seitenleiste am Rechner weiterhin ihren Chat-Reiter
       kennt; sie findet dann eben keinen Knopf zum Hervorheben. */
    const karte: Record<string, string> = { start: 'hl-start', seiten: 'hl-seiten',
                                            bespr: 'hl-bespr', mehr: 'hl-mehr' };
    l.querySelectorAll('button[role="tab"]').forEach(b => b.classList.remove('an'));
    /* KEIN RÜCKFALL AUF „START". Hier stand `karte[reiter] || 'hl-start'`,
       und das war eine Behauptung: „Mehr" und „Kompass" haben oben keinen
       Reiter, also leuchtete beim Öffnen die Start-Pille — man stand im
       Kompass, und oben stand „Start". Wer nirgends in der Reiterleiste
       ist, soll dort auch nirgends markiert sein. */
    const id = karte[reiter];
    const aktiv = id ? document.getElementById(id) : null;
    if (aktiv) aktiv.classList.add('an');
    pilleSchieben(l, aktiv);
    /* Ein Punkt, wenn im Posteingang etwas Ungelesenes liegt */
    const punkt = l.querySelector<HTMLElement>('.hl-punkt');
    if (punkt) {
      let offen = 0;
      try { offen = (Werkzeuge.meldungen ? Werkzeuge.meldungen() : [])
                      .filter((m: any) => !m.gelesen).length; } catch {}
      punkt.hidden = !offen;
    }
  };

  const reiterWechseln = (id: string) => {
    reiter = id;
    zeichneReiter();
    if (id === 'suche') { suche(); reiter = 'start'; zeichneReiter(); return; }
    if (id === 'inbox') { Ansichten.posteingang(); reiter = 'start'; zeichneReiter(); zeichneBaum(); return; }
    zeichneBaum();
  };

  const zeichneBaum = (): void => {
    const baum = document.getElementById('tree');
    /* Ohne den Baumkasten gibt es nichts zu zeichnen. Vorher stand hier
       ungeprüft `baum.innerHTML = ''` — beim Zeichnen vor dem Aufbau der
       Schale warf das und die ganze Seitenleiste blieb leer. */
    if (!baum) return;
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
          const ziel = elVon(ev);
          if (ziel?.closest('[data-hoch]'))   { ev.stopPropagation(); abschnittSchieben(id, -1); return; }
          if (ziel?.closest('[data-runter]')) { ev.stopPropagation(); abschnittSchieben(id, 1); return; }
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
      const b = elVon(e)?.closest<HTMLElement>('[data-wz]');
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
    if (lz && faellig) lz.textContent = String(faellig);
    }

    /* Agenten — wie in Notions Seitenleiste */
    if (abschnittAn('agenten')) {
    const agenten = Agent.eigene();
    baum.appendChild(abschnitt('Agenten', () => Agent.eigenerDialog()));
    const ag = document.createElement('div');
    ag.className = 'wz-block';
    ag.innerHTML = agenten.slice(0, 6).map((a: any) =>
      `<button class="side-item" data-agent="${esc(a.id)}"><span>${a.icon || '🤖'}</span>` +
      `<span>${esc(a.name)}</span></button>`).join('') +
      '<button class="side-item" data-agent="+"><span>＋</span><span>Neuer Agent</span></button>';
    ag.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-agent]');
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
        ? naechste.map((t: any) => `<button class="side-item" data-termin="${t.id}">` +
            `<span>📌</span><span>${esc(t.text)}</span>` +
            `<span class="k">${esc(t.wann)}</span></button>`).join('')
        : '<div class="side-leer">Keine bevorstehenden Ereignisse</div>') +
      '<button class="side-item" data-bes="neu"><span>🎙</span><span>Neue Besprechungsnotiz</span></button>';
    bes.addEventListener('click', e => {
      const t = elVon(e)?.closest<HTMLElement>('[data-termin]');
      if (t) { oeffne(t.dataset.termin); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-bes="neu"]')) Meeting.panel();
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
      kv.innerHTML = letzte.map((p2: any) =>
        `<button class="side-item" data-kv="${p2.id}"><span>${p2.icon || '📄'}</span>` +
        `<span>${esc(p2.text || 'Ohne Titel')}</span></button>`).join('');
      kv.addEventListener('click', e => {
        const b = elVon(e)?.closest<HTMLElement>('[data-kv]');
        if (b) oeffne(b.dataset.kv);
      });
      baum.appendChild(kv);
    }

    /* Favoriten */
    const favs = abschnittAn('favoriten') ? Store.favorites() : [];
    if (favs.length) {
      baum.appendChild(abschnitt('Favoriten'));
      favs.forEach((p: any) => baum.appendChild(zeile(p, 0)));
    }

    /* Bereiche (bei Notion: Teamspaces) */
    const bereiche = abschnittAn('bereiche') ? (Store.getMeta('bereiche', []) || []) : [];
    bereiche.forEach((b: any) => {
      const drin = Store.rootPages().filter((p: any) => p.bereich === b.id && !p.system && !p.archiviert);
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
      drin.forEach((p: any) => baum.appendChild(zeile(p, 0)));
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

    const seiten = Store.rootPages().filter((p: any) => !p.system && !p.bereich && !p.archiviert);
    if (!seiten.length) {
      const leer = document.createElement('div');
      leer.style.cssText = 'padding:8px 14px; font-size:13px; color:var(--text-faint)';
      leer.textContent = 'Noch keine Seiten';
      baum.appendChild(leer);
    }
    seiten.forEach((p: any) => baum.appendChild(zeile(p, 0)));

    /* Systemseiten (Journal, Vorlagen, Schnellnotizen) getrennt unten */
    const sys = Store.rootPages().filter((p: any) => p.system);
    if (sys.length) {
      baum.appendChild(abschnitt('Angelegt von den Werkzeugen'));
      sys.forEach((p: any) => baum.appendChild(zeile(p, 0)));
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
        if (el instanceof HTMLElement) el.style.display = versteckt ? 'none' : '';
      });
    }, 0);

    apps.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-app]');
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

    /* --- Was das Register beisteuert -------------------------------------
       Ein Bereich, der einen Eintrag in der Seitenleiste braucht, meldet ihn
       in register/navigation.js an — statt hier eine Zeile einzufügen. Sonst
       ist diese Datei die eine Stelle, die jeder anfassen muss, und ihre
       Reihenfolge hängt davon ab, wer zuletzt geladen wurde.

       `anPlatz` filtert selbst über `zeigen()`: ein Eintrag, der etwas
       verspricht, das ohne Konto nicht geht, kommt gar nicht erst mit. */
    if (typeof Register !== 'undefined' && Register.navigation) {
      const dazu = Register.navigation.anPlatz('unten').filter((x: any) => x.tun && x.vonAussen);
      if (dazu.length) {
        const kasten = document.createElement('div');
        dazu.forEach((x: any) => {
          const z = document.createElement('button');
          z.className = 'side-item';
          z.innerHTML = `<span>${esc(x.icon || '•')}</span><span>${esc(x.name)}</span>`;
          z.addEventListener('click', () => {
            try { x.tun(); }
            catch (e: unknown) {
              if (typeof Reporter !== 'undefined')
                Reporter.error('Seitenleiste', e instanceof Error ? e.message : String(e), e);
            }
          });
          kasten.appendChild(z);
        });
        baum.appendChild(kasten);
      }
    }

    /* Die selbst gewählte Reihenfolge der Abschnitte anwenden */
    abschnitteOrdnen(baum);
    /* Erweiterungsknöpfe wieder anhängen — zeichneBaum leert den Baum */
    if (typeof Erweiterung !== 'undefined' && Erweiterung.knoepfeAnhaengen) Erweiterung.knoepfeAnhaengen();
  };

  /**
   * Ordnet die fertig gezeichneten Abschnitte um.
   * Ein Abschnitt ist seine Überschrift plus alles bis zur nächsten. Was vor
   * der ersten Überschrift steht, gehört zu „Werkzeuge".
   */
  const abschnitteOrdnen = (baum: any) => {
    const folge = Store.getMeta('sidebarFolge', null);
    if (!Array.isArray(folge) || !folge.length) return;

    const nachName: Record<string, string> = {};
    ABSCHNITTE.forEach(([id, name]) => { if (name && id) nachName[name] = id; });

    type Teil = { id: string; nodes: Element[] };
    const teile: Teil[] = [];
    let jetzt: Teil = { id: 'werkzeuge', nodes: [] };
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

    const rang = (id: string) => {
      const i = folge.indexOf(id);
      return i < 0 ? 500 : i;
    };
    teile.sort((a, b) => rang(a.id) - rang(b.id));
    teile.forEach(t => t.nodes.forEach(n => baum.appendChild(n)));
  };

  /** Welche Abschnitte sind zugeklappt? Notion merkt sich das je Abschnitt. */
  const abschnittZu = (name: string) => (Store.getMeta('sidebarZu', []) || []).includes(name);

  const abschnittKlappen = (name: string) => {
    const zu = Store.getMeta('sidebarZu', []) || [];
    Store.setMeta('sidebarZu', zu.includes(name) ? zu.filter((x: any) => x !== name) : [...zu, name]);
    zeichneBaum();
  };

  /** Vom sichtbaren Namen zurück auf den Schlüssel in ABSCHNITTE. */
  const abschnittId = (name: any) => (ABSCHNITTE.find(([, n]) => n === name) || [])[0] || null;

  /**
   * Das ⋯-Menü eines Abschnitts. Was hier steht, muss auch etwas tun —
   * ein Menüpunkt, der nur da ist, damit es ihn gibt, ist schlimmer als
   * gar keiner.
   */
  const abschnittMenue = (anker: any, name: string) => {
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
      const b = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!b || (b as HTMLButtonElement).disabled) return;
      const a = b.dataset.a;
      m.remove();
      if (a === 'klappen') abschnittKlappen(name);
      if (a === 'alleZu')  { Store.setMeta('sidebarZu', ABSCHNITTE.map(x => x[1])); zeichneBaum(); }
      if (a === 'alleAuf') { Store.setMeta('sidebarZu', []); zeichneBaum(); }
      /* Ohne Kennung gibt es den Abschnitt in der Reihenfolge nicht — dann
         tun diese drei Punkte auch nichts. */
      if (!id) return;
      if (a === 'hoch')    abschnittSchieben(id, -1);
      if (a === 'runter')  abschnittSchieben(id, 1);
      if (a === 'aus')     { abschnittSchalten(id); UI.toast(name + ' ausgeblendet'); }
      if (a === 'anpassen') abschnitteAnpassen();
    });
    setTimeout(() => document.addEventListener('click',
      () => m.remove(), { once: true }), 0);
  };

  const abschnitt = (name: string, beiPlus?: any, beiZahnrad?: any) => {
    const d = document.createElement('div');
    d.className = 'side-section';
    /* Chevron zum Auf- und Zuklappen — wie in Notions Telefon-App */
    d.innerHTML = `<span>${name}<i class="ss-pfeil">${abschnittZu(name) ? '›' : '⌄'}</i></span>`;
    d.querySelector('span')?.addEventListener('click', () => abschnittKlappen(name));
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

  const zeile = (p: any, tiefe: number) => {
    const w = document.createElement('div');
    const r = document.createElement('div');
    r.className = 'row' + (p.id === aktuelleSeite() ? ' on' : '');
    r.draggable = true;

    const kinder = Store.childrenOf(p.id).filter((k: any) => k.type === 'page' && !k.archiviert);
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
    r.addEventListener('dragstart', e => { e.dataTransfer?.setData('text/seite', p.id); });
    r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('drop'); });
    r.addEventListener('dragleave', () => r.classList.remove('drop'));
    r.addEventListener('drop', e => {
      e.preventDefault(); r.classList.remove('drop');
      const quelle = e.dataTransfer?.getData('text/seite') ?? '';
      if (quelle && quelle !== p.id) {
        const q = Store.getBlock(quelle);
        if (q) Werkzeuge.verschiebe(q, p.id);
      }
    });

    w.appendChild(r);

    if (offen && kinder.length) {
      const k = document.createElement('div');
      k.className = 'kids';
      kinder.forEach((kid: any) => k.appendChild(zeile(kid, tiefe + 1)));
      w.appendChild(k);
    }
    return w;
  };

  /* ------------------------------------------------------------------------
   * Die öffentliche Fläche. `zeichne` heisst hier so, wie es heisst — der
   * alte Name `zeichneBaum` lebt in `App` weiter und reicht hierher.
   * `reiter()` liest, `reiter('chat')` setzt; es zeichnet dabei bewusst
   * nicht, weil die Aufrufstellen das schon selbst tun.
   * ----------------------------------------------------------------------*/
  return {
    binde,
    zeichne: zeichneBaum,
    zeichneReiter,
    handyLeiste,
    reiterWechseln,
    reiter: (id?: string) => { if (id !== undefined) reiter = id; return reiter; },
    ABSCHNITTE,
    abschnittAn,
    abschnittSchalten,
    abschnitteAnpassen,
    abschnitteGeordnet
  };
})();

(window as any).Seitenleiste = Seitenleiste;
