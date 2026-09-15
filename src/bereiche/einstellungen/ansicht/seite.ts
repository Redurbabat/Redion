/* ============================================================================
 * einstellungen.js — Der Einstellungsbereich
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/einstellungen/ansicht/seite.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/einstellungen/ansicht/seite.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Nach Notions Vorbild aufgebaut: links die Bereiche, rechts die Optionen.
 * Was bei Notion nur mit Konto und Server geht (Mitglieder, Abrechnung,
 * SSO), steht hier als das da, was es lokal bedeutet — ehrlich benannt,
 * nicht weggelassen.
 * ==========================================================================*/

const Einstellungen = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: any) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* Alles, was hier eingestellt wird, liegt in meta. */
  const V = (k: any, fallback: any) => Store.getMeta(k, fallback);
  const S = (k: any, v: any) => { Store.setMeta(k, v); anwenden(); };

  /* Wie in Notion in Abschnitte geordnet, nicht als eine lange Liste. */
  /* Die Navigation links: Überschrift und darunter die Bereiche als
     [Kennung, Symbol, Name]. Ohne diesen Typ liest TypeScript aus dem
     Literal ein Gemisch aus Text und Listen und kann `liste.map` nicht. */
  type Eintrag = [string, string, string];
  type Gruppe = [string, Eintrag[]];

  const GRUPPEN: Gruppe[] = [
    ['', [
      ['konto',        '👤', 'Mein Konto'],
      ['allgemein',    '⚙️', 'Einstellungen'],
      ['benachricht',  '🔔', 'Benachrichtigungen'],
      ['daten',        '⭱', 'Importieren']
    ]],
    ['Funktionen', [
      ['ki',           '✨', 'Künstliche Intelligenz'],
      ['verbindungen', '🔌', 'Verbindungen'],
      ['mcp',          '🔗', 'MCP'],
      ['worker',       '⌨️', 'Worker'],
      ['verifiziert',  '✔️', 'Verifizierte Seiten'],
      ['oeffentlich',  '🌐', 'Öffentliche Seiten'],
      ['emoji',        '😀', 'Emoji']
    ]],
    ['Verwaltung', [
      ['arbeitsplatz', '🏠', 'Arbeitsbereich'],
      ['analysen',     '📈', 'Analysen'],
      ['bereiche',     '👥', 'Bereiche'],
      ['sicherheit',   '🛡', 'Sicherheit'],
      ['schluessel',   '🔑', 'Schlüssel und APIs']
    ]],
    ['Zugriff und Abrechnung', [
      ['speicher',     '📦', 'Speicher'],
      ['abrechnung',   '💳', 'Abrechnung'],
      ['ueber',        'ℹ️', 'Über diese App']
    ]]
  ];

  const BEREICHE = GRUPPEN.flatMap(([, liste]) => liste);

  /* ========================================================================
   * ANWENDEN — Einstellungen wirken sofort
   * ======================================================================*/
  const anwenden = () => {
    document.documentElement.dataset.theme = V('theme', 'dark');
    document.body.dataset.schrift = V('schriftgroesse', 'normal');
    document.body.dataset.dichte  = V('dichte', 'normal');
    document.body.classList.toggle('kontrast', !!V('kontrast', false));
    /* Barrierefreiheit: ruhige Darstellung, leichteres Lesen, hoher Kontrast */
    document.body.dataset.bewegung = V('bewegung', 'normal');
    document.body.dataset.lesen    = V('lesen', 'normal');
    document.body.dataset.kontrast = V('kontrast', false) ? 'hoch' : 'normal';
    /* Das eigene Farbschema hat das letzte Wort — sonst würde die Zeile
       oben es bei jedem Anwenden wieder auf hell oder dunkel zurückdrehen. */
    if (typeof Aussehen !== 'undefined') Aussehen.anwenden();
  };

  /** Datum so ausgeben, wie es eingestellt ist. */
  const datum = (wert: any, mitZeit = false) => {
    if (!wert) return '';
    const d = new Date(wert);
    if (isNaN(d.getTime())) return String(wert);
    const t = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = d.getFullYear();
    const form = V('datumsformat', 'TT.MM.JJJJ');
    let s = form === 'JJJJ-MM-TT' ? `${j}-${m}-${t}`
          : form === 'MM/TT/JJJJ' ? `${m}/${t}/${j}`
          : form === 'TT. Monat JJJJ'
            ? `${d.getDate()}. ${['Januar','Februar','März','April','Mai','Juni','Juli','August',
                'September','Oktober','November','Dezember'][d.getMonth()]} ${j}`
            : `${t}.${m}.${j}`;
    if (mitZeit) {
      const st = d.getHours(), mi = String(d.getMinutes()).padStart(2, '0');
      s += V('zeitformat', '24') === '12'
        ? ` ${((st + 11) % 12) + 1}:${mi} ${st < 12 ? 'vorm.' : 'nachm.'}`
        : ` ${String(st).padStart(2, '0')}:${mi}`;
    }
    return s;
  };

  /** Beginnt die Woche am Montag? Der Kalender richtet sich danach. */
  const wochenstart = () => (V('wochenstart', 'montag') === 'sonntag' ? 0 : 1);

  /* ========================================================================
   * DER DIALOG
   * ======================================================================*/
  let offenerBereich = 'allgemein';

  /* Der Stand aus stand.ts (E361) — und der Weg, aus der Adresse gelesen. */
  const standFassung = (): string =>
    typeof Stand !== 'undefined' && Stand && Number(Stand.fassung) > 0 ? 'v' + Number(Stand.fassung) : '';
  const herkunft = (): string => {
    const ort = String(location.protocol || '');
    const wirt = String(location.hostname || '');
    if (ort === 'file:') return 'Ordner (Doppelklick auf index.html)';
    if (wirt === 'localhost' || wirt === '127.0.0.1' || wirt === '[::1]') return 'örtlicher Server (start.bat)';
    if (/\.workers\.dev$/.test(wirt) || /\.pages\.dev$/.test(wirt)) return 'Cloudflare (' + wirt + ')';
    return wirt ? 'Netz (' + wirt + ')' : 'unbekannter Weg';
  };
  const standText = (): string => {
    const fassung = standFassung();
    if (!fassung) return 'Stand unbekannt · ' + herkunft();
    const gebaut = typeof Stand !== 'undefined' && Stand.gebaut ? new Date(String(Stand.gebaut)) : null;
    const wann = gebaut && !isNaN(gebaut.getTime())
      ? ' · gebaut ' + gebaut.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return fassung + wann + ' · ' + herkunft();
  };

  const oeffne = (bereich?: any) => {
    offenerBereich = bereich || offenerBereich;
    document.querySelectorAll('.overlay').forEach(o => o.remove());

    /* ========================================================================
     * ZWEI SPALTEN AM RECHNER, ZWEI SEITEN AM TELEFON (Vorgabe §12, E58)
     * ------------------------------------------------------------------------
     * GEMESSEN AM 8. AUGUST BEI 390 PX, und es war die schlechteste Seite
     * der ganzen App: die Rechner-Aufteilung von 236 px Navigation plus
     * Inhalt lief unverändert weiter. Übrig blieben **129 Pixel** für den
     * Inhalt. Jede Beschreibung brach in Einzelwörter um — „Hell, dunkel
     * oder wie das System" stand als sechs Zeilen —, und die Auswahlfelder
     * daneben ragten über den Rand hinaus.
     *
     * Zwei Spalten passen nicht auf ein Telefon. Also zwei SEITEN: erst die
     * Liste der Bereiche, dann der gewählte Bereich mit einem Weg zurück.
     * Genau so macht es jedes Telefon-Betriebssystem, und aus demselben
     * Grund.
     *
     * `data-blick` sagt, welche der beiden gerade dran ist. Am Rechner
     * steht dieselbe Angabe da und ändert nichts — dort sind beide Spalten
     * immer sichtbar, und der Klick in die Liste zeichnet rechts neu.
     * ======================================================================*/
    const amTelefon = () => window.matchMedia('(max-width: 760px)').matches;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="einst-fenster" data-blick="liste">' +
        '<div class="einst-nav">' +
          `<div class="einst-konto"><span class="ws-icon">${esc(V('arbeitsIcon', 'N'))}</span>` +
          `<div><b>${esc(V('arbeitsName', 'Redion'))}</b>` +
          `<span>${esc(V('nutzer', 'Ohne Namen'))}</span></div></div>` +
          GRUPPEN.map(([titel, liste]) =>
            (titel ? `<div class="einst-grp">${titel}</div>` : '') +
            liste.map(([id, i, n]) =>
              `<button data-b="${id}" class="${id === offenerBereich ? 'on' : ''}">` +
              `<span class="mi">${i}</span>${n}</button>`).join('')).join('') +
        '</div>' +
        /* Der Hinweis, dass die Liste weitergeht — siehe `mehrPruefen()`
           weiter unten. Er liegt NEBEN der Liste, nicht darin: `.einst-nav`
           rollt, und ein Kind darin würde mitrollen statt unten zu bleiben.
           `.einst-fenster` ist `position:relative`, also genügt das. */
        '<div class="einst-mehr" aria-hidden="true">\u2304</div>' +
        /* Der Weg zurück zur Liste — nur am Telefon zu sehen. Ohne ihn
           wäre die zweite Seite eine Sackgasse: das ✕ schliesst alles,
           und dann fängt man von vorn an. */
        '<div class="einst-inhalt" id="ei">' +
          '<button class="einst-zurueck" data-a="liste" aria-label="Zurück zur Übersicht">' +
            '‹ Übersicht</button>' +
        '</div>' +
        '<button class="einst-zu" data-a="zu" aria-label="Schliessen">✕</button>' +
      '</div>';
    document.body.appendChild(o);

    const fenster = o.querySelector<HTMLElement>('.einst-fenster');

    const zeichne = (): void => {
      const ziel = o.querySelector('#ei');
      if (ziel) ziel.innerHTML =
        '<button class="einst-zurueck" data-a="liste" aria-label="Zurück zur Übersicht">' +
        '‹ Übersicht</button>' + inhalt(offenerBereich);
      o.querySelectorAll<HTMLElement>('.einst-nav button').forEach(b =>
        b.classList.toggle('on', b.dataset.b === offenerBereich));
      binde(o);
    };
    zeichne();

    /* ========================================================================
     * „ES GEHT NOCH WEITER" (E392)
     * ------------------------------------------------------------------------
     * GEMESSEN AM 4. SEPTEMBER, vor jeder Änderung: die Liste braucht 810 px
     * für 19 Einträge und drei Gruppenüberschriften, bekam aber nur 718 px
     * (1360×900), 632 (1280×720) oder 570 (1280×650). Verdeckt lagen immer
     * dieselben drei Einträge — Speicher, Abrechnung, Über diese App.
     *
     * Das Fenster ist jetzt hoch genug, dass auf einem gewöhnlichen Schirm
     * nichts mehr fehlt. Auf einem kleinen rollt die Liste weiterhin, und
     * DASS sie rollt, muss man sehen können. Der Rollbalken leistet das
     * nicht: er belegt ein Pixel und blendet sich aus.
     *
     * Also ein eigener Streifen — der WIEDER VERSCHWINDET, sobald man unten
     * angekommen ist. Eine Anzeige, die immer etwas anzeigt, wird nicht
     * gelesen; das ist der Fehler, in den diese App schon sechsmal gelaufen
     * ist. `test392 §3` misst genau das.
     *
     * Ein `ResizeObserver` statt eines Fensterhorchers: er hängt am Element,
     * verschwindet mit ihm und lässt beim Schliessen nichts zurück. Und er
     * feuert einmal von selbst, was den ersten Anstrich gleich mit erledigt.
     * ======================================================================*/
    const navEl = o.querySelector<HTMLElement>('.einst-nav');
    const mehrPruefen = (): void => {
      if (!navEl || !fenster) return;
      const rest = navEl.scrollHeight - navEl.clientHeight - navEl.scrollTop;
      fenster.classList.toggle('hat-mehr', rest > 4);
    };
    if (navEl) {
      navEl.addEventListener('scroll', mehrPruefen, { passive: true });
      new ResizeObserver(mehrPruefen).observe(navEl);
    }
    mehrPruefen();

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      /* Zurück zur Liste. Am Rechner kommt man hier nie hin — der Knopf
         steht dort auf `display:none`. */
      if (elVon(e)?.closest<HTMLElement>('[data-a="liste"]')) {
        fenster?.setAttribute('data-blick', 'liste');
        return;
      }
      const b = elVon(e)?.closest<HTMLElement>('.einst-nav button[data-b]');
      if (b) {
        offenerBereich = b.dataset.b ?? offenerBereich;
        zeichne();
        /* Am Telefon eine Seite weiter; am Rechner ändert die Angabe
           nichts, weil dort beide Spalten stehen. */
        if (amTelefon()) fenster?.setAttribute('data-blick', 'bereich');
        const inh = o.querySelector<HTMLElement>('#ei');
        if (inh) inh.scrollTop = 0;
      }
    });

    /* Wurde das Fenster mit einem Bereich aufgerufen — etwa aus dem
       R-Blatt heraus —, dann ist die Liste nicht gemeint. */
    if (bereich && amTelefon()) fenster?.setAttribute('data-blick', 'bereich');

    /* Escape geht eine Stufe zurück, nicht gleich ganz hinaus. Wer in
       „Sicherheit" steht und abbrechen will, meint meistens diesen
       Bereich und nicht das ganze Fenster. */
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (amTelefon() && fenster?.getAttribute('data-blick') === 'bereich') {
        e.stopPropagation();
        fenster.setAttribute('data-blick', 'liste');
        return;
      }
      document.removeEventListener('keydown', beiTaste, true);
    };
    document.addEventListener('keydown', beiTaste, true);
    /* Der Rundgang ruft das Fenster von aussen zum Neuzeichnen auf. Ein
       eigenes Feld an einem `div` gibt es im Typ nicht — hier ausdrücklich. */
    (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen = zeichne;
  };

  /* --- Bausteine ---------------------------------------------------------- */
  const zeile = (titel: string, beschreibung: any, steuerung: any) =>
    `<div class="ez-zeile"><div class="ez-text"><b>${titel}</b>` +
    (beschreibung ? `<span>${beschreibung}</span>` : '') + '</div>' +
    `<div class="ez-steuer">${steuerung}</div></div>`;

  const wahl = (schluessel: string, werte: any, jetzt: any) =>
    `<select data-set="${schluessel}">` +
    werte.map((w: any) => {
      const [wert, name] = Array.isArray(w) ? w : [w, w];
      return `<option value="${esc(wert)}"${wert === jetzt ? ' selected' : ''}>${esc(name)}</option>`;
    }).join('') + '</select>';

  /* EIN KIPPSCHALTER SAGT, WAS ER IST UND WIE ER STEHT.
     Vorher war er ein <button> ohne Text, ohne Marke und ohne Zustand: ein
     Vorleseprogramm las „Schaltfläche" und sonst nichts, und ob er an war,
     stand allein in seiner Farbe — genau das, was §38 verbietet. */
  const schalter = (schluessel: string, an: any, name = '') =>
    `<button class="schalter${an ? ' an' : ''}" data-toggle="${esc(schluessel)}" ` +
    `role="switch" aria-checked="${an ? 'true' : 'false'}"` +
    (name ? ` aria-label="${esc(name)}"` : '') + `><i></i></button>`;

  const knopf = (aktion: any, text: string, klasse = '') =>
    `<button class="ez-knopf ${klasse}" data-tun="${aktion}">${text}</button>`;

  /* EIN KNOPF, DER SEINEN VERLAUF ZEIGT (E441). Die Seite wird als Text
     gezeichnet; ein Zustandsknopf ist aber ein Element mit Zustand. Deshalb
     steht hier nur ein Platzhalter, und `binde()` tauscht ihn gegen den
     echten Knopf aus `zustandsknopf.ts`. `data-zk` bleibt am fertigen
     Knopf stehen, damit ein Prüflauf ihn findet. */
  const zustandsknopf = (id: string) => `<span data-zk="${esc(id)}"></span>`;

  /**
   * Die Aufträge der Zustandsknöpfe dieser Seite. Der Zustand kommt aus
   * der Zusage der echten Arbeit — nie aus einem Zeitgeber.
   *
   * Die Sicherung endet bei „Heruntergeladen": eine `.redion` oder `.json`
   * kann der Browser nicht öffnen, also gibt es kein „Öffnen". Die
   * HTML-Einzeldatei dagegen kann er — sie bekommt den Öffnen-Weg.
   */
  const zustandsknopfAuftrag = (id: string): ZustandsknopfAuftrag | null => {
    if (id === 'export-json') return {
      art: 'laden', klasse: 'ez-knopf',
      texte: { bereit: 'Speichern', arbeitet: 'Wird erstellt …',
               fertig: 'Heruntergeladen', fehler: 'Nicht gesichert' },
      /* `sicherungSpeichern` fängt seine Fehler selbst und sagt `false`
         (E146); der Knopf wertet genau das als Fehlschlag. */
      aktion: () => App.sicherungSpeichern()
    };
    if (id === 'einzeldatei') {
      let blob: Blob | null = null;
      return {
        art: 'laden', klasse: 'ez-knopf',
        texte: { bereit: 'Erzeugen', arbeitet: 'Wird erzeugt …',
                 geschafft: 'Heruntergeladen', fertig: 'Öffnen' },
        aktion: () => { blob = Werkzeuge.einzelDatei() as Blob; },
        /* Die Adresse wird nicht zurückgegeben: das Fenster braucht sie,
           solange es offen ist, und der Browser räumt sie mit der Seite
           auf. */
        oeffnen: () => { if (blob) window.open(URL.createObjectURL(blob), '_blank'); }
      };
    }
    return null;
  };

  const feld = (schluessel: string, wert: any, platzhalter = '') =>
    `<input data-set="${schluessel}" value="${esc(wert)}" placeholder="${esc(platzhalter)}">`;

  const kopf = (titel: string, unter?: any) =>
    `<h2>${titel}</h2>` + (unter ? `<p class="ez-unter">${unter}</p>` : '');

  /* ========================================================================
   * DIE EINZELNEN BEREICHE
   * ======================================================================*/
  const inhalt = (b: any): string => (({
    /* HIER STAND DAS GEGENTEIL DESSEN, WAS GEBAUT IST (E270).
       „Diese App kennt kein Konto und keinen Server", „es gibt keine
       Anmeldung", „Nichts wird übertragen, es gibt keine Sitzungen" —
       drei Sätze aus der Zeit vor dem Serverbau. Seither gibt es Konten
       (GitHub, Google, Gerätecode), Sitzungen, Abgleich und Freigaben,
       samt Wolke-Fenster. Wer hier nachlas, bekam die Auskunft, es gäbe
       nichts davon.
       Die Seite baut deshalb KEINEN zweiten Dialog (E29), sondern sagt
       die Wahrheit und führt zum vorhandenen. Vier Zustände, weil es
       vier gibt — und die mittleren zwei sind die wichtigsten: angemeldet
       und trotzdem nichts hinausgeschickt (E1/E34), und angemeldet mit
       einer offenen Entscheidung nach einem Einspielen (L76/E279). */
    konto: () => {
      const w = (globalThis as any).Wolke;
      const angemeldet = !!(w && w.angemeldet && w.angemeldet());
      const gleichtAb = angemeldet && !!(w.abgleichErlaubt && w.abgleichErlaubt());
      /* VIER Zustände seit L76 — es waren drei. Steht die Frage nach einem
         eingespielten „Ersetzen", ist `abgleichErlaubt()` falsch, und diese
         Seite behauptete darum „Der Abgleich ist ausgeschaltet". Das hat
         niemand ausgeschaltet: es wartet eine Entscheidung. */
      const frage = angemeldet && !!(w.neuAbgleichOffen && w.neuAbgleichOffen());
      const wo = angemeldet ? String(w.adresse?.() || '') : '';
      const geraet = angemeldet ? String(w.geraeteName?.() || '') : '';
      const einleitung = !angemeldet
        ? 'Ohne Konto liegt alles auf diesem Gerät — so wie bisher, und das bleibt ' +
          'der Normalfall. Redion hat einen eigenen Server; er ist freiwillig und ' +
          'bringt dieselben Notizen auf Rechner und Telefon.'
        : frage
          ? 'Angemeldet — aber der Abgleich wartet auf dich. Du hast eine Sicherung ' +
            'eingespielt und den Bestand ersetzt; auf dem Server liegt noch der Stand ' +
            'von vorher. Bis du im Wolke-Fenster entschieden hast, geht nichts hinaus ' +
            'und nichts herein.'
          : gleichtAb
            ? 'Angemeldet, und dieses Gerät gleicht ab' + (wo ? ' mit ' + esc(wo) : '') +
              '. Private Seiten gehen verschlüsselt hinaus; im Klartext geht nur, was ' +
              'du ausdrücklich teilst oder veröffentlichst.'
            : 'Angemeldet — aber es verlässt nichts dieses Gerät. Der Abgleich ist ' +
              'ausgeschaltet, und ohne ihn bleibt alles lokal.';
      return kopf('Mein Konto', einleitung) +
      zeile('Name', 'So wirst du in Kommentaren genannt', feld('nutzer', V('nutzer', ''), 'Dein Name')) +
      zeile('Symbol', 'Kürzel oben in der Seitenleiste', feld('arbeitsIcon', V('arbeitsIcon', 'N'))) +
      zeile('Anmeldung', angemeldet
              ? 'Mit einem Konto — Wolke, Freigaben und Abgleich sind möglich'
              : 'Ohne Konto — nur mit einem gibt es Abgleich und Freigaben',
            knopf('wolke-oeffnen', angemeldet ? 'Wolke öffnen' : 'Konto einrichten')) +
      zeile('Passwort', 'Einzelne Seiten lassen sich verschlüsseln',
            knopf('seite-sperren', 'Seite verschlüsseln')) +
      zeile('Angemeldete Geräte', angemeldet
              ? 'Die Liste und der Freigabe-Code stehen im Wolke-Fenster'
              : 'Ohne Konto gibt es keine Sitzungen',
            '<span class="ez-grau">' +
              (angemeldet ? esc(geraet || 'dieses Gerät') : 'nur dieses Gerät') +
            '</span>') +
      zeile('Alle Daten auf diesem Gerät löschen',
            angemeldet
              ? 'Leert diesen Browser. Das Konto auf dem Server bleibt — löschen ' +
                'lässt es sich im Wolke-Fenster.'
              : 'Entfernt alle Daten aus diesem Browser',
            knopf('alles-loeschen', 'Alle Daten löschen', 'warn'));
    },

    allgemein: () =>
      kopf('Einstellungen') +
      zeile('Erscheinungsbild', 'Hell, dunkel oder wie das System',
            wahl('theme', [['dark', 'Dunkel'], ['light', 'Hell'], ['system', 'Wie das System']], V('theme', 'dark'))) +
      zeile('Schriftgrösse', 'Gilt für den ganzen Text',
            wahl('schriftgroesse', [['klein', 'Klein'], ['normal', 'Normal'], ['gross', 'Gross']], V('schriftgroesse', 'normal'))) +
      zeile('Zeilenabstand', 'Enger oder luftiger',
            wahl('dichte', [['eng', 'Eng'], ['normal', 'Normal'], ['weit', 'Weit']], V('dichte', 'normal'))) +
      zeile('Beim Öffnen zeigen', 'Was erscheint, wenn du die App startest',
            wahl('startAnsicht', [['dokument', 'Zuletzt geöffnetes Dokument, sonst das Regal'],
                                  ['dokumente', 'Immer das Regal'],
                                  ['start', 'Heute – Lernen & Alltag'], ['workspace', 'Bibliothek – Seiten & Wissen'],
                                  ['notizhefte', 'Notizhefte – Regal zum Losschreiben'],
                                  ['notizheft', 'Zuletzt benutztes Heft, sofort schreibbereit'],
                                  ['letzte', 'Zuletzt geöffnete Seite'],
                                  ['journal', 'Heutiges Journal'], ['posteingang', 'Posteingang']],
                 V('startAnsicht', 'dokument'))) +
      zeile('Woche beginnt am', 'Gilt für Kalender und Kalenderwochen',
            wahl('wochenstart', [['montag', 'Montag'], ['sonntag', 'Sonntag']], V('wochenstart', 'montag'))) +
      zeile('Datumsformat', 'Wie Datumsangaben geschrieben werden',
            wahl('datumsformat', ['TT.MM.JJJJ', 'JJJJ-MM-TT', 'MM/TT/JJJJ', 'TT. Monat JJJJ'],
                 V('datumsformat', 'TT.MM.JJJJ'))) +
      zeile('Zeitformat', '', wahl('zeitformat', [['24', '24 Stunden'], ['12', '12 Stunden']], V('zeitformat', '24'))) +
      zeile('Hoher Kontrast', 'Stärkere Ränder und klarere Farben — leichter zu lesen',
            schalter('kontrast', V('kontrast', false))) +
      zeile('Ruhige Darstellung', 'Keine Animationen und Übergänge',
            wahl('bewegung', [['normal', 'Normal'], ['ruhig', 'Ruhig']], V('bewegung', 'normal'))) +
      zeile('Leichter lesen', 'Mehr Zeilenabstand, weitere Buchstaben, schmalere Zeilen',
            wahl('lesen', [['normal', 'Normal'], ['leicht', 'Leichter']], V('lesen', 'normal'))) +
      zeile('Eingabetaste macht eine neue Zeile', 'Gilt für Chat und Kommentare. ' +
            'Zum Senden dann Strg + Eingabe',
            schalter('enterZeile', V('enterZeile', false))) +
      zeile('Rechtschreibprüfung', 'Die rote Wellenlinie beim Tippen',
            schalter('rechtschreib', V('rechtschreib', false))) +
      zeile('Seitenleiste', 'Beim Start eingeklappt lassen',
            schalter('seiteZu', V('seiteZu', false))) +
      zeile('Sprache', 'Diese App gibt es bisher nur auf Deutsch',
            '<span class="ez-grau">Deutsch</span>'),

    benachricht: () =>
      kopf('Benachrichtigungen', 'Erinnerungen melden sich, solange die App offen ist. ' +
           'Mit Erlaubnis auch als Systemmeldung.') +
      zeile('Systemmeldungen', 'Erlaubnis des Browsers einholen',
            knopf('benachr-erlauben',
                  ('Notification' in window && Notification.permission === 'granted')
                    ? 'Bereits erlaubt' : 'Erlauben')) +
      zeile('Erinnerungen in der App', 'Der Streifen unten am Bildschirm',
            schalter('erinnernInApp', V('erinnernInApp', true))) +
      zeile('Karteikarten', 'Einmal am Tag melden, wenn Karten fällig sind — aus, bis du es einschaltest',
            schalter('kartenMelden', V('kartenMelden', false))) +
      zeile('Offene Erinnerungen', '', `<span class="ez-grau">${Werkzeuge.erinnerungen().filter((e: any) => !e.erledigt).length} offen</span>`) +
      zeile('Alle Erinnerungen', '', knopf('erinnerungen-zeigen', 'Posteingang öffnen')),

    verbindungen: () => {
      const z = Verbindungen.zustand();
      return kopf('Verbindungen', 'Ohne Verbindung läuft alles auf diesem Rechner. Wer will, ' +
           'kann eigene Konten anschliessen — die Schlüssel bleiben in diesem Browser und ' +
           'gehen nur an den jeweiligen Dienst.') +
      zeile('Ollama', 'Lokale KI auf diesem Rechner',
            `<span class="ez-grau">${KI.zustand.quelle === 'ollama' ? 'verbunden' : 'nicht gefunden'}</span> ` +
            knopf('ollama-suchen', 'Erneut suchen')) +
      zeile('WebLLM', 'KI direkt im Browser',
            `<span class="ez-grau">${'gpu' in navigator ? 'möglich' : 'kein WebGPU'}</span>`) +

      kopf('Verbundene Dienste', '') +
      zeile('Google', 'Kalender und Gmail — braucht eine eigene Client-ID, kostenlos',
            `<span class="ez-grau">${z.google.verbunden
              ? 'verbunden' + (z.google.profil ? ' als ' + esc(z.google.profil.email) : '')
              : (z.google.id ? 'Client-ID da, nicht angemeldet' : 'nicht eingerichtet')}</span> ` +
            knopf('verbindungen', 'Einrichten')) +
      zeile('Kalender', 'Google, iCloud und jede ICS-Adresse',
            `<span class="ez-grau">${z.ics.anzahl} Abos</span> ` + knopf('kalender-verb', 'Öffnen', 'weiter')) +
      zeile('Mail', 'Gmail holen, beschriften, beantworten — oder EML-Dateien einlesen',
            knopf('mail-verb', 'Öffnen', 'weiter')) +
      zeile('GitHub und Jira', 'Issues und Vorgänge als gespiegelte Datenbank',
            `<span class="ez-grau">${z.github.verbunden ? 'GitHub verbunden' : 'nicht verbunden'}` +
            `</span> ` + knopf('spiegel-verb', 'Öffnen', 'weiter')) +
      zeile('MCP-Server', 'Fremde Werkzeuge für die KI',
            `<span class="ez-grau">${(Store.getMeta('mcp:server', []) || []).length} eingetragen</span> ` +
            knopf('mcp-verb', 'Öffnen', 'weiter')) +
      zeile('Web Clipper', 'Webseiten sammeln — ohne Browsererweiterung',
            knopf('clipper', 'Einrichten')) +
      zeile('Ordner auf der Festplatte', 'Notizen als Markdown-Dateien ablegen',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Brücke', 'Für Dienste, die den Browser nicht direkt heranlassen',
            `<span class="ez-grau">${z.bruecke ? 'eingetragen' : 'keine'}</span> ` +
            knopf('verbindungen', 'Eintragen')) +
      zeile('Anmeldung möglich?', 'Google lässt sie nur von einer echten Adresse zu',
            `<span class="ez-grau">${z.adresse ? 'ja — ' + esc(location.origin)
              : 'nein — als Datei geöffnet, start.bat benutzen'}</span>`);
    },

    arbeitsplatz: () =>
      kopf('Arbeitsbereich') +
      zeile('Name', 'Steht oben in der Seitenleiste', feld('arbeitsName', V('arbeitsName', 'Redion'))) +
      zeile('Symbol', 'Ein Buchstabe oder ein Emoji', feld('arbeitsIcon', V('arbeitsIcon', 'N'))) +
      zeile('Seiten', '', `<span class="ez-grau">${Links.seiten().length}</span>`) +
      zeile('Datenbanken', '', `<span class="ez-grau">${Object.keys(Store.cache.collections).length}</span>`) +
      zeile('Startseite festlegen', 'Welche Seite die Startseite ist',
            knopf('startseite-waehlen', 'Seite wählen')) +
      zeile('Alles als Website ausgeben', 'Eine HTML-Datei mit allen Seiten',
            knopf('einzeldatei', 'Erzeugen')) +
      zeile('Arbeitsbereich löschen', 'Alle Seiten und Datenbanken',
            knopf('alles-loeschen', 'Alles löschen', 'warn')),

    bereiche: () => {
      const liste = V('bereiche', []) || [];
      return kopf('Bereiche', 'Was bei Notion „Teamspaces" heisst: Gruppen für deine Seiten. ' +
                  'Jede Seite kann einem Bereich zugeordnet werden, die Seitenleiste sortiert danach.') +
        '<div class="bereich-liste">' +
        (liste.length ? liste.map((b: any) =>
          `<div class="bereich-zeile"><span class="b-ico">${esc(b.icon)}</span>` +
          `<b>${esc(b.name)}</b>` +
          `<span class="ez-grau">${Links.seiten().filter(p => p.bereich === b.id).length} Seiten</span>` +
          `<button data-bereich-weg="${b.id}">🗑</button></div>`).join('')
          : '<div class="ez-grau" style="padding:10px 0">Noch keine Bereiche angelegt.</div>') +
        '</div>' +
        zeile('Neuen Bereich anlegen', 'Zum Beispiel „Arbeit", „Privat", „Studium"',
              knopf('bereich-neu', 'Bereich anlegen')) +
        zeile('Seite einem Bereich zuordnen', 'Geht auch im Seitenmenü',
              knopf('bereich-zuordnen', 'Seite zuordnen'));
    },

    sicherheit: () =>
      kopf('Sicherheit', 'Alles liegt auf diesem Gerät. Es gibt niemanden, dem man etwas freigeben müsste.') +
      zeile('Seiten verschlüsseln', 'AES-256 mit Passwort, je Seite einzeln',
            knopf('seite-sperren', 'Offene Seite verschlüsseln')) +
      zeile('Verschlüsselte Seiten', '',
            `<span class="ez-grau">${Links.seiten().filter(p => p.locked).length}</span>`) +
      zeile('Gegen Bearbeiten sperren', 'Schutz vor versehentlichem Tippen',
            knopf('seite-schreibschutz', 'Offene Seite sperren')) +
      zeile('Automatische Versionen', 'Beim Seitenwechsel eine Fassung sichern',
            schalter('autoVersionen', V('autoVersionen', true))) +
      kopf('Konten und Rollen', 'Fünf Rollen wie in Notion. Ehrlich gesagt: ohne eigenen ' +
           'Server ist das eine Absprache, kein Schloss — wer die Daten im Browser hat, ' +
           'kommt an alles heran. Die Anmeldung über Google liefert immerhin eine ' +
           'geprüfte Identität.') +
      zeile('Konten', 'Von Hand angelegt oder über Google angemeldet',
            `<span class="ez-grau">${Konten.alle().length} · angemeldet als ` +
            `${esc(Konten.aktiv().name)}</span> ` + knopf('konten', 'Verwalten')) +
      zeile('Berechtigungsmatrix', 'Was darf welche Rolle?',
            knopf('rechte-matrix', 'Ansehen')) +
      zeile('Freigabe dieser Seite', 'Wer darf lesen, kommentieren, bearbeiten',
            knopf('freigabe', 'Öffnen')) +
      zeile('Standardrolle', 'Gilt für Seiten ohne eigene Freigabe',
            wahl('rolleStandard', Konten.ROLLEN.map(r => [r.id, r.icon + ' ' + r.name]),
                 V('rolleStandard', 'voll'))) +
      zeile('Anmeldung über Google', 'Liefert geprüften Namen und geprüfte E-Mail',
            `<span class="ez-grau">${Verbindungen.googleProfil()
              ? esc(Verbindungen.googleProfil().email) : 'nicht angemeldet'}</span> ` +
            knopf('verbindungen', 'Einrichten')) +
      zeile('SAML SSO und Nutzerbereitstellung', 'Braucht einen Identitätsanbieter und einen Server',
            '<span class="ez-grau">nicht möglich ohne Server</span>') +
      zeile('Datenschutz', '',
            '<span class="ez-grau">alles im Browser; nur was du verbindest, geht hinaus</span>'),

    daten: () => {
      /* DIE AUTOMATISCHE SICHERUNG (E270).
         Redur wollte „alle Daten auf iCloud". Ein Browser kann nicht in
         iCloud schreiben — aber er kann in EINEN Ordner schreiben, den
         man ihm gezeigt hat, und wenn dieser Ordner in iCloud Drive (oder
         OneDrive, oder Dropbox) liegt, erledigt den Rest der Dienst
         selbst.
         Kann der Browser das nicht — Safari auf iPhone und iPad, Firefox —
         steht hier ein Satz und KEIN Knopf. Ein Knopf, der beim Drücken
         nichts tut, ist der Fehler, gegen den §47 geschrieben ist. */
      const os = (globalThis as any).OrdnerSicherung;
      const ordnerGeht = !!(os && os.moeglich && os.moeglich());
      const ordnerAn = !!(os && os.an && os.an());
      const ordnerName = ordnerAn ? String(os.name() || '') : '';
      const ordnerFehler = os && os.fehler ? String(os.fehler() || '') : '';
      const ordnerZuletzt = ordnerAn && os.zuletzt ? String(os.zuletzt() || '') : '';
      const ordnerRecht = !ordnerGeht
        ? '<span class="ez-grau">in diesem Browser nicht möglich</span>'
        : ordnerAn
          ? `<span class="ez-grau">${esc(ordnerName)}</span> ` +
            knopf('ordner-sicherung-jetzt', 'Jetzt sichern') + ' ' +
            knopf('ordner-sicherung-aus', 'Abschalten')
          : knopf('ordner-sicherung-an', 'Ordner wählen');
      const ordnerUnter = !ordnerGeht
        ? 'Safari auf iPhone und iPad und Firefox können keinen Ordner behalten. ' +
          'Dort bleibt „Sicherung speichern" von Hand — oder du gleichst über die ' +
          'Wolke ab.'
        : ordnerFehler
          ? ordnerFehler
          : ordnerAn
            ? 'Alle fünf Minuten, aber nur wenn sich etwas geändert hat. Die letzten ' +
              'sieben Tage bleiben vollständig liegen, davor je Monat eine.' +
              (ordnerZuletzt
                /* Ohne Sekunden — bei einer Sicherung, die alle fünf Minuten
                   nachsieht, ist die Sekunde kein Wissen, sondern Lärm. */
                ? ' Zuletzt: ' + esc(new Date(ordnerZuletzt).toLocaleString('de-CH',
                    { dateStyle: 'short', timeStyle: 'short' }))
                : ' Noch nichts geschrieben.')
            : 'Wähle einen Ordner — zum Beispiel in iCloud Drive, OneDrive oder ' +
              'Dropbox. Redion legt dort selbständig vollständige Sicherungen ab, ' +
              'und der Dienst bringt sie auf deine anderen Geräte.';
      return kopf('Import und Export') +
      zeile('Sicherung speichern', 'Alles als eine JSON-Datei', zustandsknopf('export-json')) +
      zeile('Sicherung laden', 'Ersetzt den jetzigen Inhalt', knopf('import-json', 'Laden')) +
      zeile('Markdown-Ordner schreiben', 'Je Seite eine .md-Datei, Unterseiten in Unterordnern',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Markdown-Ordner einlesen', 'Legt aus jeder Datei eine Seite an',
            knopf('ordner-lesen', 'Ordner wählen')) +
      zeile('Dateien einlesen', 'Markdown, Text, CSV, TSV, HTML, Excel (.xlsx), Word (.docx), EPUB — ' +
            'Excel wird zur Datenbank, EPUB zu einem Wiki mit Kapiteln',
            knopf('dateien-lesen', 'Dateien wählen')) +
      zeile('Als eine HTML-Datei', 'Zum Weitergeben und Archivieren', zustandsknopf('einzeldatei')) +
      zeile('Offene Seite als Markdown', '', knopf('seite-md', 'Speichern')) +
      zeile('Offene Seite als HTML', '', knopf('seite-html', 'Speichern')) +
      zeile('Offene Seite drucken oder als PDF', '', knopf('seite-pdf', 'Drucken')) +
      zeile('Sicherung in einen Ordner', ordnerUnter,
            ordnerRecht + (ordnerFehler ? ' ' + knopf('ordner-sicherung-an', 'Neu wählen') : '')) +
      /* DER SCHALTER HIESS „Beim Schliessen an eine Sicherung erinnern" (E270).
         Das konnte er nicht halten: beim Entladen einer Seite darf kein
         Fenster mehr aufgehen, und was der Schalter versprach, war nirgends
         gebaut. Jetzt verspricht er, was die Plattform hergibt — und
         `OrdnerSicherung` löst es beim Zurückkommen ein, über dieselbe
         Wochenfrist, die `Sicherung.ERINNERN` ohnehin führt. */
      zeile('An die Sicherung erinnern',
            'Beim Zurückkommen melden, wenn die letzte Sicherung älter als eine ' +
            'Woche ist',
            schalter('sicherungErinnern', V('sicherungErinnern', false)));
    },

    ki: () =>
      kopf('Künstliche Intelligenz', 'Beide Wege sind kostenlos und laufen auf deinem Rechner. ' +
           'Kein Schlüssel, keine Abrechnung, kein Text, der hinausgeht.') +
      zeile('Aktives Modell', '', `<span class="ez-grau">${esc(KI.zustand.modell || 'keins')}</span> ` +
            knopf('ki-modell', 'Wechseln')) +
      zeile('Ollama', 'Schneller und besser, einmalige Installation nötig',
            `<span class="ez-grau">${KI.zustand.quelle === 'ollama' ? 'läuft' : 'nicht gefunden'}</span> ` +
            knopf('ollama-suchen', 'Suchen')) +
      zeile('WebLLM', 'Ohne Installation, dafür langsamer',
            knopf('ki-modell', 'Modell laden')) +
      zeile('Seiteninhalt mitgeben', 'Die KI sieht die offene Seite als Zusammenhang',
            schalter('kiKontext', V('kiKontext', true))) +
      zeile('Antwortlänge', '', wahl('kiLaenge', [['kurz', 'Kurz'], ['normal', 'Normal'], ['lang', 'Ausführlich']],
            V('kiLaenge', 'normal'))) +
      zeile('KI-Felder in Datenbanken', 'Spaltentyp „KI-Feld" füllt sich selbst',
            '<span class="ez-grau">verfügbar</span>') +

      /* --- Quellen: was darf die KI überhaupt sehen? ------------------- */
      kopf('Quellen', 'Die KI weiss nichts über deinen Arbeitsbereich. Sie bekommt die ' +
           'passenden Ausschnitte gereicht — und zwar nur aus den Quellen, die hier ' +
           'eingeschaltet sind. Jede Antwort nennt danach ihre Quellen.') +
      zeile('Die offene Seite', 'Was gerade auf dem Bildschirm steht',
            schalter('q:aktuelleSeite', Kontext.quellen().aktuelleSeite)) +
      zeile('Arbeitsbereich', 'Alle Seiten, die du lesen darfst',
            schalter('q:arbeitsbereich', Kontext.quellen().arbeitsbereich)) +
      zeile('Datenbanken', 'Auch Mails, Termine und gespiegelte Einträge',
            schalter('q:datenbanken', Kontext.quellen().datenbanken)) +
      zeile('Verbundene Dienste', 'Was über Verbindungen hereingeholt wurde',
            schalter('q:verbindungen', Kontext.quellen().verbindungen)) +
      zeile('Websuche', 'Wikipedia nachschlagen — dabei verlässt der Suchbegriff den Rechner',
            schalter('q:web', Kontext.quellen().web)) +
      zeile('Vor jeder Webanfrage nachfragen', 'Sicherheitshalber einmal bestätigen',
            schalter('ki:webFragen', V('ki:webFragen', true))) +
      /* NUR-QUELLEN-MODUS (E305). Er steht bewusst UNTER den Quellen und
         nicht bei den Antwortlängen: er ist keine Geschmacksfrage, sondern
         die Zusage, dass nichts kommt, was nicht in den eingeschalteten
         Quellen steht. */
      zeile('Nur aus meinen Quellen antworten',
            'Findet sich nichts, wird das Modell gar nicht erst gefragt — statt ' +
            'einer Antwort, die nirgends nachzulesen ist',
            schalter('ki:nurQuellen', V('ki:nurQuellen', false))) +

      /* --- Gedächtnis --------------------------------------------------- */
      kopf('Gedächtnis', 'Die KI erinnert sich nicht wie ein Mensch. Sie findet wieder, ' +
           'was du gespeichert hast. Der Suchindex ist dieses Gedächtnis.') +
      zeile('Suchindex', 'Wird bei Bedarf neu gebaut',
            `<span class="ez-grau">${Kontext.holen().anzahl} Einträge</span> ` +
            knopf('index-neu', 'Neu bauen')) +
      zeile('Echte Vektoren', 'Genauere Suche über einen Anbieter — kostet ein paar Cent, ' +
            'braucht einen Schlüssel bei Gemini oder OpenAI',
            schalter('ki:embeddings', V('ki:embeddings', false)) + ' ' +
            knopf('emb-bauen', 'Berechnen')) +
      zeile('Anbieter für Vektoren', '',
            wahl('ki:embAnbieter', [['gemini', 'Google Gemini'], ['openai', 'OpenAI']],
                 V('ki:embAnbieter', 'gemini'))) +
      zeile('Dauerhafte Anweisungen', 'Gilt für jede Antwort und jeden Agenten',
            `<textarea data-set="ki:persoenlich" rows="3" class="ez-lang" ` +
            `placeholder="z. B. Antworte immer auf Deutsch. Fasse lange Antworten am Ende ` +
            `kurz zusammen.">${esc(V('ki:persoenlich', ''))}</textarea>`) +

      /* --- Agenten und Besprechungen ------------------------------------ */
      kopf('Agenten und Besprechungen', '') +
      zeile('Agenten', 'Vier feste Typen plus eigene mit eigenen Rechten',
            `<span class="ez-grau">${Agent.alle().length} vorhanden</span> ` +
            knopf('agent-verwalten', 'Verwalten')) +
      zeile('Workers', 'Eigener Code als Werkzeug, läuft abgeschottet',
            `<span class="ez-grau">${Agent.worker().length}</span> ` +
            knopf('agent-worker', 'Bearbeiten')) +
      zeile('Besprechungsnotizen', 'Aufnehmen, mitschreiben, auswerten',
            `<span class="ez-grau">${Meeting.kannZuhoeren() ? 'Mitschreiben geht' : 'nur Aufnahme'}` +
            `</span> ` + knopf('meet-einst', 'Einstellungen')) +

      /* --- Kosten und Grenzen (L104 Punkt 1, E321) ------------------------
         Das Buch gab es seit E287, die Griffe `stand()`, `monatJeAnbieter()`
         und `grenzenSetzen()` auch — nur sah man nichts davon. Wer seine
         Grenzen ändern wollte, konnte es allein über die Konsole. Das ist
         §47 von der leisen Seite: eine Bremse, die wirkt, aber die niemand
         einstellen kann, ist eine fremde Entscheidung. */
      (() => {
        const lage = KiKosten.belegLage(KiBuch.buchungen(),
                                        new Date().toISOString().slice(0, 7));
        const stand = KiBuch.stand();
        const g = KiBuch.grenzen();
        const jeAnb = KiBuch.monatJeAnbieter();
        const alt = KiKosten.standSatz(Date.now());

        const grenzfeld = (k: string, wert: number) =>
          `<input type="number" min="0" step="0.01" class="ez-grenze" ` +
          `data-grenze="${k}" value="${esc(String(wert))}"> ` +
          `<span class="ez-grau">${esc(KiKosten.WAEHRUNG)}</span>`;

        return kopf('Kosten und Grenzen',
          'Gilt nur für Wolken-Modelle mit eigenem Schlüssel. Ollama und WebLLM ' +
          'kosten nichts und werden nicht gebremst.') +

          /* DIE ZAHL MIT IHRER GRUNDLAGE, wie E289 es für die Lernzahlen
             vormacht. Und ohne Buchung steht hier nichts — „0,00 $, 0 %
             gezählt" wäre eine Zeile, die nichts behauptet. */
          (lage.anzahl
            ? zeile('Diesen Monat', esc(KiKosten.belegSatz(lage)),
                    `<b>${esc(KiKosten.geld(stand.monat))}</b>`) +
              zeile('Heute', '', `<span class="ez-grau">${esc(KiKosten.geld(stand.heute))}</span>`) +
              /* NUR ANBIETER, DIE ETWAS GEKOSTET HABEN. Groq mit einem
                 freien Modell steht sonst mit „0,00 USD" da — eine Zeile,
                 die nichts behauptet und trotzdem Platz nimmt. Wer wissen
                 will, wohin das Geld geht, will die sehen, die welches
                 gekostet haben. */
              Object.keys(jeAnb).filter(a => (jeAnb[a] ?? 0) > 0).sort().map(a =>
                zeile(esc(a), '', `<span class="ez-grau">${esc(KiKosten.geld(jeAnb[a] ?? 0))}</span>`)
              ).join('')
            : zeile('Diesen Monat', 'Noch kein Wolken-Aufruf verbucht.',
                    '<span class="ez-grau">—</span>')) +

          zeile('Höchstens je Aufruf', 'Darüber fragt Redion nicht an',
                grenzfeld('jeAufruf', g.jeAufruf)) +
          zeile('Höchstens je Agentenlauf', 'Eine Schleife, die entgleist, kostet nichts weiter',
                grenzfeld('jeLauf', g.jeLauf)) +
          zeile('Höchstens am Tag', '', grenzfeld('jeTag', g.jeTag)) +
          zeile('Höchstens im Monat', '', grenzfeld('jeMonat', g.jeMonat)) +

          /* Der Hinweis zur alternden Preisliste kommt erst nach einem
             halben Jahr (E319). Bis dahin steht hier nur das Datum. */
          zeile('Preisliste', alt ? '<b>' + esc(alt) + '</b>'
                                  : 'Stand: ' + esc(KiKosten.STAND),
                knopf('ki-buch-leeren', 'Buch leeren'));
      })() +

      /* --- Datenschutz --------------------------------------------------- */
      kopf('Datenschutz', '') +
      zeile('Daten zur Verbesserung freigeben', 'Es gibt niemanden, an den etwas ginge',
            '<span class="ez-grau">aus — dauerhaft</span>') +
      zeile('Wohin dein Text geht', '',
            '<span class="ez-grau">' +
            (KI.zustand.quelle === 'wolke'
              ? 'an ' + (KI.anbieter(KI.zustand.anbieter).name) + ' — dein Schlüssel, dein Konto'
              : 'nirgendwohin — das Modell läuft auf diesem Rechner') + '</span>'),

    schluessel: () => {
      const zeilen = KI.ANBIETER.map((a: any) => {
        const wert = V('api:' + a.id, '');
        const gesetzt = !!wert;
        return zeile(
          a.name + (a.frei ? ' <em class="frei">kostenloses Kontingent</em>' : ''),
          a.hinweis + (a.woher ? ' · Schlüssel holen: <b>' + a.woher + '</b>' : ''),
          `<input type="password" data-set="api:${a.id}" value="${esc(wert)}" ` +
          `placeholder="${a.id === 'eigen' ? 'nicht nötig' : 'Schlüssel einfügen'}" autocomplete="off">` +
          (gesetzt ? '<button class="ez-knopf" data-tun="pruefen:' + a.id + '">Prüfen</button>' : ''));
      }).join('');

      return kopf('Schlüssel und APIs',
        'Hier hinterlegst du eigene Zugänge. Alles bleibt in diesem Browser und geht nur an ' +
        'den jeweiligen Anbieter — nie an mich, nie an sonst jemanden. ' +
        'Die App läuft auch ganz ohne Schlüssel: Ollama und WebLLM brauchen keinen.') +

        '<div class="ez-plan"><b>Erst das Kostenlose</b><span>' +
        'Ohne jeden Schlüssel: <b>Ollama</b> auf dem Rechner und <b>WebLLM</b> im Browser. ' +
        'Mit kostenlosem Kontingent und eigenem Schlüssel: <b>Groq</b>, <b>OpenRouter</b> ' +
        '(Modelle mit <code>:free</code>) und <b>Google Gemini</b>. ' +
        'Danach erscheinen die Modelle oben rechts im KI-Panel zur Auswahl.' +
        '</span></div>' +

        '<h3 class="ez-h3">Sprachmodelle</h3>' + zeilen +

        zeile('Adresse des eigenen Servers', 'Alles, was wie OpenAI antwortet — LM Studio, llama.cpp, vLLM',
              feld('api:eigenUrl', V('api:eigenUrl', ''), 'http://localhost:1234/v1/chat/completions')) +
        zeile('Modellname beim eigenen Server', '', feld('api:eigenModell', V('api:eigenModell', ''), 'z. B. local-model')) +

        '<h3 class="ez-h3">Weitere Dienste</h3>' +
        zeile('Notion', 'Für den Import aus einem echten Notion-Arbeitsbereich. ' +
              'Schlüssel holen: <b>notion.so/my-integrations</b>',
              feld('api:notion', V('api:notion', ''), 'secret_… oder ntn_…')) +
        zeile('Webhook-Adresse', 'Automationen können hier etwas hinschicken — Zapier, Make, n8n, eigener Server',
              feld('api:webhook', V('api:webhook', ''), 'https://…')) +
        /* Anmeldung am Webhook — Notion schickt gar keine mit, viele Dienste
           weisen deshalb jede Anfrage ab. */
        zeile('Webhook-Anmeldung', 'Wie sich Redion beim Webhook ausweist',
              '<select data-set="webhookAuthArt">' +
              [['keine', 'ohne Anmeldung'],
               ['bearer', 'Bearer-Schlüssel im Kopf'],
               ['basic', 'Basic (name:passwort)'],
               ['kopf', 'eigener Kopfzeilenname'],
               ['geheim', 'Geheimnis im Datenpaket']]
                .map(([id, n]) => `<option value="${id}"` +
                  (V('webhookAuthArt', 'keine') === id ? ' selected' : '') + `>${n}</option>`).join('') +
              '</select>') +
        zeile('Schlüssel oder Passwort für den Webhook', 'Bleibt im Browser und geht nur an diese eine Adresse',
              feld('api:webhookAuth', V('api:webhookAuth', ''), 'Schlüssel')) +
        zeile('Name der Kopfzeile', 'Nur bei „eigener Kopfzeilenname"',
              feld('webhookAuthName', V('webhookAuthName', 'X-Api-Key'), 'X-Api-Key')) +
        zeile('Wetterdienst', 'Open-Meteo braucht keinen Schlüssel und ist kostenlos',
              '<span class="ez-grau">kein Schlüssel nötig</span>') +
        zeile('Karten', 'OpenStreetMap braucht keinen Schlüssel und ist kostenlos',
              '<span class="ez-grau">kein Schlüssel nötig</span>') +
        zeile('Wikipedia', 'Nachschlagen ohne Schlüssel, direkt aus der KI heraus',
              '<span class="ez-grau">kein Schlüssel nötig</span>') +

        '<div class="ez-warnung">Ein Schlüssel im Browser ist bequem, aber nicht geheim: ' +
        'Wer an dieses Browserprofil kommt, kann ihn auslesen. Nimm deshalb Schlüssel mit ' +
        'engem Rahmen und lösche sie, wenn du sie nicht mehr brauchst.</div>';
    },

    speicher: () =>
      kopf('Speicher', 'Alles liegt in IndexedDB in diesem Browserprofil.') +
      '<div id="speicher-zahlen" class="ez-grau" style="padding:4px 0 14px">wird gemessen …</div>' +
      zeile('Blöcke', '', `<span class="ez-grau">${Object.keys(Store.cache.blocks).length}</span>`) +
      zeile('Datenbanken', '', `<span class="ez-grau">${Object.keys(Store.cache.collections).length}</span>`) +
      zeile('Ansichten', '', `<span class="ez-grau">${Object.keys(Store.cache.views).length}</span>`) +
      /* „N Seiten" stimmte nur zur Hälfte: daneben lagen weggelegte Blöcke,
         die niemand zählte und niemand zeigte. Wer hier eine Zahl liest,
         soll wissen, wie viel wirklich im Papierkorb liegt. */
      zeile('Papierkorb', '', `<span class="ez-grau">${Store.trashed().length} Seiten` +
            ((Store.papierkorbBloecke ? Store.papierkorbBloecke().length : 0)
              ? `, ${Store.papierkorbBloecke().length} Blöcke` : '') +
            '</span> ' + knopf('papierkorb', 'Öffnen')) +
      zeile('Papierkorb selbst leeren', 'Nach dieser Frist wird endgültig gelöscht — wie Notions 30 Tage',
            wahl('papierkorbTage', [['30', 'nach 30 Tagen'], ['7', 'nach 7 Tagen'],
                                    ['90', 'nach 90 Tagen'], ['0', 'nie']],
                 String(V('papierkorbTage', 30)))) +
      zeile('Alte Versionen aufräumen',
            'Dünnt aus statt abzuschneiden: die jüngsten bleiben, danach eine je Tag, ' +
            'danach eine je Monat. Von Hand gesicherte bleiben alle',
            knopf('versionen-aufraeumen', 'Aufräumen')) +
      zeile('Speicher dauerhaft anfordern', 'Der Browser räumt die Daten dann nicht von selbst weg',
            knopf('speicher-sichern', 'Anfordern')) +

      /* --- Lange Arbeiten (L103 Punkt 5, E342) ---------------------------
         OCR über achtzig Seiten, ein grosser Import, ein Embedding-Lauf.
         Die Auftragsmaschine konnte sie seit E286 überleben, aber nicht
         WARTEN WOLLEN — sie liefen, sobald sie dran waren. Ohne diesen
         Abschnitt wäre der Zeitplan da und niemand käme heran (§47), wie
         die KI-Grenzen vor E321. */
      (() => {
        const b: any = (typeof Auftraege !== 'undefined' && Auftraege.plan)
          ? Auftraege.plan() : null;
        const l: any = (typeof Auftraege !== 'undefined' && Auftraege.lage)
          ? Auftraege.lage() : { laedt: null, teuer: null };
        /* DIE UHRZEIT ZEIGT DER BROWSER, NICHT REDION. Ein
           `<input type="time">` folgt der Spracheinstellung des BROWSERS,
           nicht dem `lang` des Dokuments — nachgemessen: `lang="de"` am
           Feld ändert gar nichts. Auf einem englisch eingestellten Browser
           steht dort „10:00 PM", während der Satz darüber „22:00" sagt.

           Das bleibt so, und zwar mit Absicht: ein eigenes Feld verlöre die
           Uhr zum Antippen, die Tastaturbedienung und das Rad am Telefon
           (§37, §38). Wer seinen Browser auf Englisch stellt, ERWARTET
           „10:00 PM". Der Satz darüber sagt es zusätzlich auf Deutsch. */
        const zeit = (k: string, wert: any) =>
          `<input type="time" class="ez-plan-zeit" data-plan="${k}" ` +
          `value="${esc(Zeitplan.uhr(wert) || '')}">`;
        /* `schalter`, NICHT `ez-schalter`. Der erste Wurf erfand die zweite
           Klasse, und weil es dazu kein Stück CSS gibt, stand dort ein
           Knopf ohne Grösse, ohne Farbe, ohne alles — ein Schalter, den
           niemand sehen und niemand treffen kann (§47). Kein Prüflauf
           hatte etwas dagegen; gefunden auf dem Bild (§55.1). */
        const haken = (k: string, an: boolean) =>
          `<button type="button" class="schalter${an ? ' an' : ''}" ` +
          `data-plan-an="${esc(k)}" role="switch" aria-checked="${an ? 'true' : 'false'}" ` +
          `aria-label="${esc(k)}"><i></i></button>`;

        return kopf('Lange Arbeiten',
          'Gilt für neue Aufträge — Seitenbilder, OCR, grosse Sicherungen. ' +
          'Was schon läuft, läuft weiter.') +

          /* DER SATZ NUR, WENN ES EINEN GIBT. Ohne Zeitplan steht hier
             nichts — eine Zeile „kein Zeitplan eingestellt" wäre eine
             Zeile, die nichts behauptet (E321, gleiche Stelle). */
          (Zeitplan.hatBedingung(b)
            ? zeile('Eingestellt', '', `<b>${esc(Zeitplan.satz(b))}</b>`)
            : '') +

          /* „Nur von … bis …" und nicht „zwischen … und …" — damit die Zeile
             dieselben Wörter benutzt wie der Satz zwei Zeilen darüber. */
          zeile('Nur von', 'Leer lassen heisst: zu jeder Zeit',
                zeit('von', b && b.vonMinute) + ' <span class="ez-grau">bis</span> ' +
                zeit('bis', b && b.bisMinute)) +

          /* WAS DER BROWSER NICHT WEISS, STEHT DABEI. Firefox und Safari
             kennen `getBattery` nicht; dort wirkt „nur am Strom" nicht,
             und das gehört an den Schalter geschrieben statt still zu
             geschehen. Ein Auftrag wartet deswegen trotzdem nie ewig:
             unbekannt heisst ja (siehe `core/jobs/zeitplan.ts`). */
          zeile('Nur am Strom',
                l.laedt === null
                  ? 'Dieser Browser sagt nicht, ob geladen wird — der Schalter bleibt dann wirkungslos'
                  : (l.laedt ? 'Das Gerät lädt gerade' : 'Das Gerät lädt gerade nicht'),
                haken('amStrom', !!(b && b.amStrom))) +

          zeile('Nicht über eine teure Verbindung',
                l.teuer === null
                  ? 'Dieser Browser sagt nichts über die Verbindung — der Schalter bleibt dann wirkungslos'
                  : (l.teuer ? 'Die Verbindung kostet gerade' : 'Die Verbindung kostet gerade nichts'),
                haken('nichtTeuer', !!(b && b.nichtTeuer)));
      })(),

    abrechnung: () =>
      kopf('Abrechnung') +
      '<div class="ez-plan"><b>Kostenlos, für immer</b>' +
      '<span>Keine Stufen, kein Abo, keine Begrenzung auf Blöcke, Gäste oder Dateigrössen. ' +
      'Diese App läuft auf deinem Rechner — es entstehen keine Kosten, die jemand abrechnen könnte.</span></div>' +
      zeile('Plan', '', '<span class="ez-grau">Alles enthalten</span>') +
      zeile('Mitglieder', '', '<span class="ez-grau">du</span>') +
      zeile('KI-Guthaben', 'Lokale Modelle rechnen nicht ab', '<span class="ez-grau">unbegrenzt</span>') +
      zeile('Speicherplatz', 'So viel, wie dein Browser hergibt', '<span class="ez-grau">gerätabhängig</span>') +
      zeile('Rechnungen', '', '<span class="ez-grau">keine</span>'),

    /* --- MCP ------------------------------------------------------------ */
    mcp: () => {
      const server = Store.getMeta('mcp:server', []) || [];
      const aus = Store.getMeta('mcp:eigenAus', []) || [];
      return kopf('MCP', 'Ein offenes Protokoll, mit dem Programme fremde Werkzeuge ' +
        'benutzen und eigene anbieten. Diese App kann beides — mit einer Einschränkung, ' +
        'die unten steht.') +
      zeile('Fremde Server', 'Werkzeuge, die dein Agent benutzen darf',
            `<span class="ez-grau">${server.length} eingetragen</span> ` +
            knopf('mcp-verb', 'Verwalten')) +
      zeile('Eigene Werkzeuge', 'Der Katalog dieser App im MCP-Format',
            `<span class="ez-grau">${MCP.eigenerKatalog().length} freigegeben, ` +
            `${aus.length} abgeschaltet</span> ` + knopf('mcp-verb', 'Ansehen')) +
      zeile('Freigabeliste', 'Nur mit diesen Adressen wird gesprochen',
            `<span class="ez-grau">${(MCP.freigegeben().length
              ? MCP.freigegeben().join(', ') : 'keine Sperre')}</span>`) +
      zeile('Als Server erreichbar?', 'Ein Browser kann nichts entgegennehmen',
            '<span class="ez-grau">nur über die Brücke — bruecke.js oder Cloudflare</span>') +
      zeile('Protokollfassung', '', `<span class="ez-grau">${MCP.VERSION}</span>`);
    },

    /* --- Öffentliche Seiten --------------------------------------------- */
    oeffentlich: () => {
      const seiten = Links.seiten().filter(p2 => p2.oeffentlich);
      return kopf('Öffentliche Seiten', 'In Notion heisst das „im Web veröffentlichen". ' +
        'Ohne Server kann diese App keine Seite ins Netz stellen — was sie kann: eine ' +
        'fertige HTML-Datei erzeugen, die überall läuft, und die ganze App bei ' +
        'Cloudflare veröffentlichen.') +
      zeile('Als HTML-Datei ausgeben', 'Eine Seite, die überall aufgeht — ohne diese App',
            knopf('html-seite', 'Offene Seite ausgeben')) +
      zeile('Ganzen Arbeitsbereich ausgeben', 'Eine einzige Datei mit allem',
            knopf('archiv', 'Erzeugen')) +
      zeile('Zum Veröffentlichen vorgemerkt', 'Diese Seiten kommen beim Ausgeben mit',
            `<span class="ez-grau">${seiten.length}</span> ` +
            knopf('oeff-merken', 'Offene Seite vormerken')) +
      (seiten.length
        ? seiten.slice(0, 12).map(p2 =>
            zeile(esc(p2.icon || '📄') + ' ' + esc(p2.text || 'Ohne Titel'), '',
                  `<button class="ez-knopf" data-tun="oeff-weg:${p2.id}">Entfernen</button>`)).join('')
        : '') +
      zeile('Die ganze App im Netz', 'Cloudflare Pages, kostenlos',
            '<span class="ez-grau">CLOUDFLARE.md im App-Ordner</span>');
    },

    /* --- Worker ---------------------------------------------------------- */
    worker: () => {
      const liste = Agent.worker();
      return kopf('Worker', 'Kleine Programme, die auf deine Daten losgelassen werden — ' +
        'in einem eigenen Faden, ohne Zugriff auf die Seite. Notion nennt das seit 2026 ' +
        '„Worker"; hier läuft es in einem Web Worker mit fünf Sekunden Zeitgrenze.') +
      zeile('Neuen Worker schreiben', 'JavaScript, bekommt die Zeilen als eingabe',
            knopf('worker-neu', 'Schreiben')) +
      zeile('Vorhanden', '', `<span class="ez-grau">${liste.length}</span>`) +
      (liste.length
        ? liste.map((w: any, i: any) =>
            zeile('⌨️ ' + esc(w.name), esc((w.code || '').slice(0, 70)) + ' …',
              `<button class="ez-knopf" data-tun="worker-lauf:${i}">Laufen lassen</button> ` +
              `<button class="ez-knopf" data-tun="worker-weg:${i}">Löschen</button>`)).join('')
        : '<div class="ez-grau" style="padding:8px 0">Noch keiner. Ein Worker bekommt ' +
          '<code>eingabe</code> und gibt mit <code>return</code> etwas zurück.</div>') +
      zeile('Zeitgrenze', 'Danach wird abgebrochen',
            wahl('workerZeit', [['5', '5 Sekunden'], ['15', '15 Sekunden'], ['30', '30 Sekunden']],
                 V('workerZeit', '5'))) +
      zeile('Was ein Worker darf', 'Rechnen, umformen, zusammenzählen',
            '<span class="ez-grau">kein DOM, kein Netz, kein Speicherzugriff</span>');
    },

    /* --- Verifizierte Seiten --------------------------------------------- */
    verifiziert: () => {
      const alle = Object.values<any>(Store.cache.blocks)
        .filter(b2 => b2.type === 'page' && b2.alive !== false && !b2.system);
      const geprueft = alle.filter(p2 => p2.geprueft);
      const faellig = geprueft.filter(p2 => p2.gepruefBis && Date.parse(p2.gepruefBis) < Date.now());
      return kopf('Verifizierte Seiten', 'Eine geprüfte Seite trägt oben ein Häkchen: ' +
        'jemand hat bestätigt, dass der Inhalt stimmt. Läuft die Prüfung ab, ' +
        'verschwindet das Häkchen wieder.') +
      zeile('Offene Seite prüfen', 'Setzt das Häkchen und trägt dich als Prüfer ein',
            knopf('pruef-setzen', 'Als geprüft markieren')) +
      zeile('Gültigkeitsdauer', 'Wie lange eine Prüfung hält',
            wahl('pruefDauer', [['30', 'Ein Monat'], ['90', 'Drei Monate'],
                                ['180', 'Ein halbes Jahr'], ['0', 'Ohne Ablauf']],
                 V('pruefDauer', '90'))) +
      zeile('Geprüft', '', `<span class="ez-grau">${geprueft.length} von ${alle.length}</span>`) +
      zeile('Abgelaufen', 'Die brauchen einen neuen Blick',
            `<span class="ez-grau">${faellig.length}</span>` +
            (faellig.length ? ' ' + knopf('pruef-erneuern', 'Alle erneuern') : '')) +
      (geprueft.length
        ? geprueft.slice(0, 12).map(p2 =>
            zeile((p2.geprueft ? '✔️ ' : '') + esc(p2.text || 'Ohne Titel'),
              'geprüft von ' + esc(p2.geprueftVon || 'dir') +
              (p2.gepruefBis ? ' · gültig bis ' + String(p2.gepruefBis).slice(0, 10) : ''),
              `<button class="ez-knopf" data-tun="pruef-weg:${p2.id}">Häkchen entfernen</button>`)).join('')
        : '');
    },

    /* --- Analysen -------------------------------------------------------- */
    analysen: () => {
      const bloecke = Object.values<any>(Store.cache.blocks).filter(b2 => b2.alive !== false);
      const seiten = bloecke.filter(b2 => b2.type === 'page' && !b2.system);
      const dbs = Object.values<any>(Store.cache.collections);
      const zeilen2 = dbs.reduce((n, c) => n + Store.rowsOf(c.id).length, 0);
      const woerter = bloecke.reduce((n, b2) =>
        n + ((b2.text || '').trim() ? b2.text.trim().split(/\s+/).length : 0), 0);
      const aufrufe = seiten.reduce((n, p2) => n + (p2.aufrufe || 0), 0);
      const meist = [...seiten].sort((a, b2) => (b2.aufrufe || 0) - (a.aufrufe || 0)).slice(0, 8);
      const tage: Record<string, number> = {};
      seiten.forEach(p2 => {
        const t = String(p2.created || '').slice(0, 10);
        if (t) tage[t] = (tage[t] || 0) + 1;
      });
      const letzte = Object.entries<any>(tage).sort().slice(-7);
      const hoch = Math.max(1, ...letzte.map(x => Number(x[1]) || 0));

      return kopf('Analysen', 'Wie viel hier steht und was am meisten benutzt wird. ' +
        'Alle Zahlen kommen aus diesem Gerät — es wird nichts gemeldet.') +
      '<div class="an-kacheln">' +
        [[seiten.length, 'Seiten'], [bloecke.length, 'Blöcke'], [dbs.length, 'Datenbanken'],
         [zeilen2, 'Zeilen'], [woerter.toLocaleString('de-CH'), 'Wörter'], [aufrufe, 'Aufrufe']]
          .map(([n, t]) => `<div class="an-kachel"><b>${n}</b><span>${t}</span></div>`).join('') +
      '</div>' +
      zeile('Neue Seiten je Tag', 'Die letzten sieben Tage mit Zuwachs',
            '<div class="an-balken">' +
            (letzte.length
              ? letzte.map(([t, n]) =>
                  `<i style="height:${Math.round(n / hoch * 100)}%" title="${t}: ${n}"></i>`).join('')
              : '<span class="ez-grau">noch keine</span>') + '</div>') +
      (meist.length
        ? '<div class="ez-grp">Meist geöffnet</div>' +
          meist.map(p2 => zeile(esc(p2.icon || '📄') + ' ' + esc(p2.text || 'Ohne Titel'), '',
                `<span class="ez-grau">${p2.aufrufe || 0}×</span>`)).join('')
        : '') +
      zeile('Als CSV ausgeben', 'Zahlen zum Weiterrechnen',
            knopf('analysen-csv', 'Herunterladen'));
    },

    /* --- Emoji ----------------------------------------------------------- */
    emoji: () => {
      const eigene = Store.getMeta('emoji:eigene', []) || [];
      return kopf('Emoji', 'Eigene Bilder als Symbol für Seiten und Datenbanken. ' +
        'Sie liegen im Browser und werden nirgendwohin geschickt.') +
      zeile('Eigenes Symbol hinzufügen', 'Bild wählen — wird auf 64 Pixel gebracht',
            knopf('emoji-neu', 'Bild wählen')) +
      zeile('Vorhanden', '', `<span class="ez-grau">${eigene.length}</span>`) +
      (eigene.length
        ? '<div class="emoji-eigene">' + eigene.map((e: any, i: any) =>
            `<button data-tun="emoji-weg:${i}" title="${esc(e.name)} — klicken zum Entfernen">` +
            `<img src="${esc(e.bild)}" alt=""></button>`).join('') + '</div>'
        : '<div class="ez-grau" style="padding:8px 0">Noch keine eigenen Symbole.</div>') +
      zeile('Emoji-Stil', 'Wie die Standardsymbole gezeichnet werden',
            wahl('emojiStil', [['system', 'Wie das Betriebssystem'], ['flach', 'Schlicht']],
                 V('emojiStil', 'system')));
    },

    ueber: () =>
      kopf('Über diese App') +
      '<div class="ez-ueber">' +
      '<p>Eine Notiz- und Datenbank-App im Stil von Notion — vollständig lokal.</p>' +
      '<p>Gebaut auf einer Analyse von Notion (Datenmodell, Blocktypen, Eigenschaften, ' +
      'Filter, Formelsprache, Tastenkürzel, Farben) und dem Vergleich von zwanzig ' +
      'quelloffenen Notiz-Programmen.</p>' +
      '</div>' +
      zeile('Bausteine', '', `<span class="ez-grau">${Blocks.TYPEN.length}</span>`) +
      zeile('Eigenschaftstypen', '', `<span class="ez-grau">${Datenbank.TYPEN.length}</span>`) +
      zeile('Ansichten', '', `<span class="ez-grau">${Datenbank.LAYOUTS.length}</span>`) +
      zeile('Formelfunktionen', '', '<span class="ez-grau">über 130</span>') +
      zeile('Eigene Formelfunktionen',
            'Einmal definieren, in jeder Formel nutzen — Notion kann das nicht',
            knopf('formelbib', 'Bibliothek öffnen')) +
      zeile('Tastenkürzel', '', knopf('kuerzel', 'Alle anzeigen')) +
      zeile('Speicherort der Daten', '', '<span class="ez-grau">IndexedDB „notizen"</span>') +
      /* DER STAND UND DER WEG (E361, L83 Punkt 2): welche Fassung laeuft,
         wann ihr Inhalt zuletzt gebaut wurde, und ob Redur gerade den
         Ordner, start.bat oder Cloudflare ansieht. Drei Wege, und keiner
         nannte sich — jetzt steht es hier, wo man nachsieht, wenn etwas
         „alt aussieht". */
      zeile('Stand', 'Fassung des Programms und der Weg, über den es gerade läuft',
            `<span class="ez-grau ez-stand" data-fassung="${esc(standFassung())}">${esc(standText())}</span>`)
  } as Record<string, () => string>)[b] || (() => kopf('Unbekannt')))();

  /* ========================================================================
   * BEDIENUNG
   * ======================================================================*/
  const binde = (o: any) => {
    /* Auswahlfelder und Textfelder */
    o.querySelectorAll('[data-set]').forEach((el: any) => {
      el.addEventListener('change', () => {
        let wert = el.value;
        if (el.dataset.set === 'theme' && wert === 'system')
          wert = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        S(el.dataset.set, wert);
        App.zeichneSeite(); App.zeichneBaum();
      });
      if (el.tagName === 'INPUT') el.addEventListener('input', () => {
        S(el.dataset.set, el.value);
        kopfzeileAuffrischen();
      });
    });

    /* Schalter */
    o.querySelectorAll('[data-toggle]').forEach((b: any) => {
      b.addEventListener('click', () => {
        const k = b.dataset.toggle;

        /* Die Quellen der KI liegen zusammen in einem Eintrag, nicht einzeln */
        if (k.startsWith('q:')) {
          const name = k.slice(2);
          const jetzt = Kontext.quellen()[name];
          if (name === 'web' && !jetzt && V('ki:webFragen', true) &&
              !confirm('Für die Websuche wird Wikipedia angefragt. Dabei verlässt dein ' +
                       'Suchbegriff den Rechner. Einschalten?')) return;
          Kontext.quelleSetzen(name, !jetzt);
          b.classList.toggle('an', !jetzt);
          document.querySelectorAll('.ki-quellschalter [data-qs="' + name + '"]')
            .forEach(x => x.classList.toggle('an', !jetzt));
          return;
        }

        /* `kartenMelden` steht NICHT mehr in dieser Liste: seine Vorgabe ist
           seit E409 aus. Redur bekam den Streifen auf jedem Bildschirm zu
           sehen, ohne je danach gefragt zu haben. Der Schalter bleibt — wer
           die Meldung will, holt sie sich. */
        const neu = !V(k, k === 'erinnernInApp' ||
                          k === 'kiKontext' || k === 'autoVersionen' || k === 'ki:webFragen');
        S(k, neu);
        b.classList.toggle('an', neu);
        if (k === 'rechtschreib') App.zeichneSeite();
      });
    });

    /* KI-Grenzen (L104 Punkt 1, E321).
       Eigene Verdrahtung und kein `data-set`: die vier Grenzen liegen
       ZUSAMMEN in einem Eintrag `ki:grenzen`, nicht als vier Schlüssel.
       Ein `data-set` schriebe vier neue Einträge und die Bremse läse
       weiter die alten — ein Regler, der sich bewegt und nichts bewirkt
       (§47). */
    o.querySelectorAll('[data-grenze]').forEach((el: any) => {
      const uebernehmen = () => {
        const wert = Number(el.value);
        if (!Number.isFinite(wert) || wert < 0) { el.value = String(KiBuch.grenzen()[el.dataset.grenze]); return; }
        KiBuch.grenzenSetzen({ [el.dataset.grenze]: wert });
      };
      el.addEventListener('change', uebernehmen);
      el.addEventListener('blur', uebernehmen);
    });

    /* Zeitplan für lange Arbeiten (L103 Punkt 5, E342).
       Wieder eigene Verdrahtung, und aus demselben Grund wie eine Zeile
       weiter oben: die vier Werte liegen ZUSAMMEN in einem Eintrag
       `auftragPlan`. Vier `data-set`-Schlüssel wären vier Regler, die sich
       bewegen und nichts bewirken (§47). */
    const planSchreiben = async (aendern: (b: any) => void) => {
      const b: any = { ...(Auftraege.plan() as any || {}) };
      aendern(b);
      await Auftraege.planSetzen(b);
      /* Neu zeichnen, weil der Satz oben („zwischen 22:00 und 06:00 und
         nur am Strom") sich mitändert. */
      (o as any).neuZeichnen && (o as any).neuZeichnen();
    };
    const ausUhr = (text: string): number | null => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || '').trim());
      if (!m) return null;
      const h = Number(m[1]), min = Number(m[2]);
      if (!(h >= 0 && h < 24 && min >= 0 && min < 60)) return null;
      return h * 60 + min;
    };
    o.querySelectorAll('[data-plan]').forEach((el: any) => {
      el.addEventListener('change', () => {
        const k = el.dataset.plan === 'von' ? 'vonMinute' : 'bisMinute';
        void planSchreiben(b => { 
          const wert = ausUhr(el.value);
          if (wert === null) delete b[k]; else b[k] = wert;
        });
      });
    });
    o.querySelectorAll('[data-plan-an]').forEach((el: any) => {
      el.addEventListener('click', () => {
        const k = el.dataset.planAn;
        void planSchreiben(b => { b[k] = !b[k]; });
      });
    });

    /* Bereiche löschen */
    o.querySelectorAll('[data-bereich-weg]').forEach((b: any) => {
      b.addEventListener('click', () => {
        const id = b.dataset.bereichWeg;
        S('bereiche', (V('bereiche', []) || []).filter((x: any) => x.id !== id));
        Links.seiten().filter(p => p.bereich === id).forEach(p => Store.updateBlock(p.id, { bereich: '' }));
        App.zeichneBaum();
        o.neuZeichnen();
      });
    });

    /* Knöpfe */
    o.querySelectorAll('[data-tun]').forEach((b: any) =>
      b.addEventListener('click', () => tun(b.dataset.tun, o)));

    /* Die Zustandsknöpfe (E441): Platzhalter gegen das echte Element
       tauschen. Ein Platzhalter ohne Auftrag bleibt leer — lieber eine
       Lücke, die auffällt, als ein Knopf, der nichts tut. */
    (o as HTMLElement).querySelectorAll<HTMLElement>('span[data-zk]').forEach(platz => {
      const id = platz.dataset['zk'] ?? '';
      const auftrag = zustandsknopfAuftrag(id);
      if (!auftrag || typeof Zustandsknopf === 'undefined') return;
      const griff = Zustandsknopf.bauen(auftrag);
      griff.element.dataset['zk'] = id;
      platz.replaceWith(griff.element);
    });

    /* Speicherplatz nachreichen */
    const zahlen = o.querySelector('#speicher-zahlen');
    if (zahlen) Store.usage().then(u => {
      zahlen.textContent = (u && u.benutzt !== undefined && u.verfuegbar !== undefined)
        ? `${(u.benutzt / 1048576).toFixed(1)} MB benutzt von etwa ` +
          `${(u.verfuegbar / 1073741824).toFixed(1)} GB, die der Browser erlaubt`
        : 'Der Browser sagt nicht, wie viel Platz belegt ist.';
    });
  };

  const kopfzeileAuffrischen = () => {
    /* SEIT E236 TRÄGT AUCH DIE MENÜLEISTE DAS ZEICHEN (`mb-konto`).
       Hier stand `btn.querySelector('.ws-icon')` — eine Stelle, ein
       Zeichen. Wer es änderte, sah es in der Seitenleiste sofort und in
       der Menüleiste erst nach dem nächsten Neuzeichnen: zwei Buchstaben
       für einen Arbeitsbereich. Gesucht wird deshalb im ganzen Blatt. */
    document.querySelectorAll('.ws-icon').forEach(ico => {
      ico.textContent = V('arbeitsIcon', 'N');
    });
    const btn = document.querySelector('#btn-settings');
    if (!btn) return;
    /* NACH BEDEUTUNG, NICHT NACH PLATZ (E590) — dieselbe Falle wie in
       `schale.ts`: `span[1]` war der Name und ist seit der
       Bewegungsschicht das Zeichen. */
    const name = btn.querySelector('.ws-name');
    if (name) name.textContent = V('arbeitsName', 'Redion');
  };

  const tun = async (was: any, o: any) => {
    const seite = App.aktuelleSeite() ? Store.getBlock(App.aktuelleSeite()) : null;

    if (was === 'ki-buch-leeren') {
      /* GEFRAGT WIRD VORHER. Das Buch ist die einzige Auskunft darüber, was
         die Wolke bisher gekostet hat — weg ist weg, und die 70 Tage
         Historie kommen nicht zurück (§46). */
      if (!confirm('Alle verbuchten KI-Kosten löschen? Die Übersicht beginnt ' +
                   'danach wieder bei null. Die Grenzen bleiben.')) return;
      KiBuch.leeren();
      UI.toast('Das KI-Buch ist leer.');
      o.neuZeichnen && o.neuZeichnen();
      return;
    }

    if (was === 'index-neu') {
      const ix = Kontext.bauen();
      UI.toast('Suchindex neu gebaut: ' + ix.anzahl + ' Einträge');
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was === 'emb-bauen') {
      if (!V('ki:embeddings', false)) { UI.toast('Erst „Echte Vektoren" einschalten'); return; }
      UI.toast('Vektoren werden berechnet …');
      try {
        const e = await Kontext.embeddingsBauen((n, g) => {
          if (n % 40 === 0) UI.toast(n + ' von ' + g + ' berechnet');
        });
        UI.toast('Fertig: ' + e.neu + ' neu, ' + e.gesamt + ' gespeichert');
      } catch (err: unknown) { UI.banner('Vektoren: ' +
        (err instanceof Error ? err.message : String(err)), 'warn'); }
      return;
    }
    if (was === 'agent-verwalten') { o.remove(); Agent.eigenerDialog(); return; }
    if (was === 'agent-worker')    { o.remove(); Agent.workerDialog(); return; }
    if (was === 'meet-einst')      { Meeting.einstellungenDialog(); return; }
    if (was === 'verbindungen')    { o.remove(); Verbindungen.dialog(); return; }
    if (was === 'kalender-verb')   { o.remove(); Kalender.dialog(); return; }
    if (was === 'mail-verb')       { o.remove(); Mail.dialog(); return; }
    if (was === 'spiegel-verb')    { o.remove(); Spiegel.dialog(); return; }
    if (was === 'clipper')         { o.remove(); Clipper.dialog(); return; }
    if (was === 'mcp-verb')        { o.remove(); MCP.dialog(); return; }
    if (was === 'html-seite') {
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
      /* `Werkzeuge.alsHtmlDatei` gibt es nicht; die Einzeldatei schreibt
         `einzelDatei()`. Der Zweig war tot, es lief immer das Teilen-Menü. */
      Werkzeuge.einzelDatei();
      return;
    }
    if (was === 'oeff-merken') {
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
      Store.updateBlock(seite.id, { oeffentlich: !seite.oeffentlich });
      UI.toast(seite.oeffentlich ? 'Nicht mehr vorgemerkt' : 'Vorgemerkt');
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was.startsWith('oeff-weg:')) {
      Store.updateBlock(was.slice(9), { oeffentlich: false });
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    /* --- Worker ---------------------------------------------------------- */
    if (was === 'worker-neu') {
      const name = await UI.frage('Wie heisst der Worker?', 'Zahlen zusammenzählen');
      if (!name) return;
      const code = await UI.frage('JavaScript — bekommt eingabe, gibt etwas zurück',
        'return eingabe.length + " Zeilen";');
      if (!code) return;
      const liste = Agent.worker();
      liste.push({ name, code });
      Store.setMeta('agent:worker', liste);
      o.neuZeichnen && o.neuZeichnen();
      UI.toast('Worker gemerkt');
      return;
    }
    if (was.startsWith('worker-weg:')) {
      const liste = Agent.worker().filter((_: any, i: any) => i !== +was.slice(11));
      Store.setMeta('agent:worker', liste);
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was.startsWith('worker-lauf:')) {
      const w = Agent.worker()[+was.slice(12)];
      if (!w) return;
      const daten = Object.values<any>(Store.cache.collections)
        .flatMap(c => Store.rowsOf(c.id).map(r => ({ titel: r.text, ...(r.props || {}) })));
      try {
        const raus = await Agent.workerLaufen(w, daten);
        UI.toast('Ergebnis: ' + JSON.stringify(raus).slice(0, 120));
      } catch (e: unknown) { UI.toast('Der Worker ist gescheitert: ' +
        (e instanceof Error ? e.message : String(e))); }
      return;
    }

    /* --- Verifizierte Seiten --------------------------------------------- */
    if (was === 'pruef-setzen') {
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }
      const tage = +Store.getMeta('pruefDauer', '90') || 0;
      Store.updateBlock(seite.id, {
        geprueft: true,
        geprueftVon: Store.getMeta('nutzer', '') || 'Ich',
        geprueftAm: Store.now(),
        gepruefBis: tage ? new Date(Date.now() + tage * 86400000).toISOString() : ''
      });
      o.neuZeichnen && o.neuZeichnen();
      App.zeichneSeite();
      UI.toast('Als geprüft markiert');
      return;
    }
    if (was.startsWith('pruef-weg:')) {
      Store.updateBlock(was.slice(10), { geprueft: false, gepruefBis: '' });
      o.neuZeichnen && o.neuZeichnen();
      App.zeichneSeite();
      return;
    }
    if (was === 'pruef-erneuern') {
      const tage = +Store.getMeta('pruefDauer', '90') || 0;
      Object.values<any>(Store.cache.blocks)
        .filter(p2 => p2.geprueft && p2.gepruefBis && Date.parse(p2.gepruefBis) < Date.now())
        .forEach(p2 => Store.updateBlock(p2.id, {
          gepruefBis: tage ? new Date(Date.now() + tage * 86400000).toISOString() : '',
          geprueftAm: Store.now()
        }));
      o.neuZeichnen && o.neuZeichnen();
      UI.toast('Prüfungen erneuert');
      return;
    }

    /* --- Analysen -------------------------------------------------------- */
    if (was === 'analysen-csv') {
      const seiten = Object.values<any>(Store.cache.blocks)
        .filter(b2 => b2.type === 'page' && b2.alive !== false && !b2.system);
      const zeilen2 = [['Seite', 'Aufrufe', 'Angelegt', 'Zuletzt geändert']]
        .concat(seiten.map(p2 => [
          (p2.text || 'Ohne Titel').replace(/"/g, '""'),
          p2.aufrufe || 0, String(p2.created || '').slice(0, 10),
          String(p2.edited || '').slice(0, 10)
        ]));
      const csv = zeilen2.map(z => z.map(x => `"${x}"`).join(';')).join('\n');
      const l = document.createElement('a');
      l.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      l.download = 'notizen-analysen.csv';
      l.click();
      UI.toast('CSV gespeichert');
      return;
    }

    if (was === 'emoji-neu') {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.addEventListener('change', async () => {
        const f = inp.files?.[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { UI.toast('Bitte ein Bild unter 2 MB'); return; }
        const bild = await new Promise(ok2 => {
          const fr = new FileReader();
          fr.onload = () => {
            /* Auf 64 Pixel bringen — sonst wird der Speicher voll */
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = c.height = 64;
              const g = c.getContext('2d');
              if (!g) { ok2(String(fr.result ?? '')); return; }
              g.drawImage(img, 0, 0, 64, 64);
              ok2(c.toDataURL('image/png'));
            };
            img.onerror = () => ok2(String(fr.result ?? ''));
            img.src = String(fr.result ?? '');
          };
          fr.readAsDataURL(f);
        });
        const l = Store.getMeta('emoji:eigene', []) || [];
        l.push({ name: f.name.replace(/\.[^.]+$/, ''), bild });
        Store.setMeta('emoji:eigene', l.slice(0, 60));
        UI.toast('Symbol hinzugefügt');
        o.neuZeichnen && o.neuZeichnen();
      });
      inp.click();
      return;
    }
    if (was.startsWith('emoji-weg:')) {
      const l = Store.getMeta('emoji:eigene', []) || [];
      l.splice(+was.slice(10), 1);
      Store.setMeta('emoji:eigene', l);
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was === 'konten')          { o.remove(); Konten.verwalten(); return; }
    if (was === 'rechte-matrix')   { Konten.matrix(); return; }
    if (was === 'freigabe')        { if (seite) { o.remove(); Konten.freigeben(seite.id); } return; }

    if (was.startsWith('pruefen:')) {
      const id = was.slice(8);
      UI.toast('Frage ' + KI.anbieter(id).name + ' …');
      try {
        KI.zustand.quelle = 'wolke';
        KI.zustand.anbieter = id;
        KI.zustand.modell = id === 'eigen'
          ? Store.getMeta('api:eigenModell', 'lokal') : KI.anbieter(id).modelle[0];
        let antwort = '';
        for await (const t of KI.wolkeFragen(
          [{ role: 'user', content: 'Antworte nur mit dem Wort: bereit' }], KI.zustand.modell)) antwort += t;
        UI.toast(antwort.trim() ? '✓ ' + KI.anbieter(id).name + ' antwortet: ' + antwort.trim().slice(0, 40)
                                : 'Antwort war leer');
        KI.zustand.bereit = true;
      } catch (err) {
        UI.banner(KI.anbieter(id).name + ' meldet: ' +
          (err instanceof Error ? err.message : String(err)), 'fehler');
      }
      return;
    }

    const karte = {
      'benachr-erlauben': async () => {
        if (!('Notification' in window)) { UI.toast('Dieser Browser kennt keine Benachrichtigungen'); return; }
        const erg = await Notification.requestPermission();
        UI.toast(erg === 'granted' ? 'Benachrichtigungen erlaubt' : 'Bleiben aus');
        o.neuZeichnen();
      },
      'erinnerungen-zeigen': () => { o.remove(); Ansichten.posteingang(); },
      'ollama-suchen': async () => { UI.toast('Suche nach Ollama …'); await KI.start();
                                        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.(); },
      'ki-modell': () => { o.remove(); App.kiPanel(true); setTimeout(() => KI.modellMenue(), 200); },
      'ordner-schreiben': () => Werkzeuge.ordnerSchreiben(),
      'ordner-lesen': () => { o.remove(); Werkzeuge.ordnerLesen(); },
      'dateien-lesen': () => { o.remove(); Werkzeuge.dateienLesen(); },
      'einzeldatei': () => Werkzeuge.einzelDatei(),
      'export-json': () => App.sicherungSpeichern(),
      /* --- Die automatische Sicherung in einen Ordner (E270) -----------
         `waehlen` bekommt die Zusage-Frage als Angabe gereicht, statt
         selbst ein `confirm` zu bauen — so nimmt die Oberfläche ihren
         eigenen Dialog (E29) und ein Prüflauf kann sie setzen. */
      'ordner-sicherung-an': async () => {
        const os = (globalThis as any).OrdnerSicherung;
        if (!os) return;
        const erg = await os.waehlen((frage: string) => Dialog.wahl({
          titel: 'Automatisch in diesen Ordner sichern?',
          text: frage,
          knoepfe: [
            { id: 'ja', text: 'Ja, ab jetzt automatisch sichern',
              hinweis: 'Alle fünf Minuten, aber nur wenn sich etwas geändert hat' },
            { id: '', text: 'Abbrechen',
              hinweis: 'Es wird kein Ordner gemerkt und nichts geschrieben' }
          ]
        }).then((w: string) => w === 'ja'));
        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.();
        if (erg.ok) UI.toast('Redion sichert ab jetzt nach „' + erg.name + '"');
        else if (erg.grund) UI.banner(erg.grund, 'fehler');
      },
      'ordner-sicherung-jetzt': async () => {
        const os = (globalThis as any).OrdnerSicherung;
        if (!os) return;
        UI.toast('Sicherung wird geschrieben …');
        await os.jetztSichern(true);
        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.();
      },
      'ordner-sicherung-aus': async () => {
        const os = (globalThis as any).OrdnerSicherung;
        if (!os) return;
        /* Was im Ordner liegt, bleibt liegen — und das muss dastehen,
           sonst rechnet jemand mit dem Gegenteil. */
        const w = await Dialog.wahl({
          titel: 'Automatische Sicherung abschalten?',
          text: 'Redion sichert dann nicht mehr von selbst in „' + os.name() + '".',
          knoepfe: [
            { id: 'aus', text: 'Abschalten',
              hinweis: 'Was schon im Ordner liegt, bleibt unangetastet liegen' },
            { id: '', text: 'Abbrechen', hinweis: 'Es bleibt, wie es ist' }
          ]
        });
        if (w !== 'aus') return;
        os.loesen();
        (o as HTMLElement & { neuZeichnen?: () => void }).neuZeichnen?.();
        UI.toast('Automatische Sicherung abgeschaltet');
      },
      'import-json': () => App.sicherungLaden(() => o.remove()),
      'seite-md': () => seite && App.markdownExport(seite),
      'seite-html': () => seite && Werkzeuge.htmlExport(seite),
      'seite-pdf': () => { o.remove(); if (seite) Werkzeuge.drucken(seite); },
      'seite-sperren': () => { o.remove(); if (seite) Werkzeuge.sperren(seite); },
      /* Der Weg zum vorhandenen Wolke-Fenster — dasselbe Muster, mit dem
         es das Mehr-Blatt schon öffnet (E251). Kein zweiter Dialog (E29),
         und kein Import: der Bereich greift über den globalen Namen (§5). */
      'wolke-oeffnen': () => {
        o.remove();
        const wf = (globalThis as any).WolkeFenster;
        if (wf?.dialog) wf.dialog();
        else UI.toast('Die Wolke ist in dieser Fassung nicht geladen.');
      },
      'seite-schreibschutz': () => {
        if (!seite) return;
        Store.updateBlock(seite.id, { gesperrt: !seite.gesperrt });
        App.zeichneSeite();
        UI.toast(seite.gesperrt ? 'Bearbeiten wieder erlaubt' : 'Seite gegen Bearbeiten gesperrt');
      },
      'papierkorb': () => { o.remove(); App.papierkorb(); },
      'kuerzel': () => { o.remove(); Werkzeuge.tastenkuerzel(); },
      'formelbib': () => { o.remove(); Werkzeuge.formelBibliothek(); },
      'startseite-waehlen': () => {
        o.remove();
        Blocks.seitenPicker('Welche Seite soll die Startseite sein?', (id: string) => {
          Store.setMeta('startSeite', id);
          Store.setMeta('startAnsicht', 'seite');
          UI.toast('Startseite gesetzt');
        });
      },
      'bereich-neu': async () => {
        const name = await UI.frage('Name des Bereichs', 'Arbeit');
        if (!name) return;
        const icon = await UI.frage('Ein Symbol dafür', '💼');
        const liste = V('bereiche', []) || [];
        liste.push({ id: Store.uid().slice(0, 6), name, icon: icon || '📁' });
        S('bereiche', liste);
        App.zeichneBaum();
        o.neuZeichnen();
      },
      'bereich-zuordnen': () => {
        const liste = V('bereiche', []) || [];
        if (!liste.length) { UI.toast('Erst einen Bereich anlegen'); return; }
        o.remove();
        Blocks.seitenPicker('Welche Seite soll zugeordnet werden?', (id: string) => {
          const m = UI.menu('<div class="grp">In welchen Bereich?</div>' +
            liste.map((b: any) => `<button data-b="${b.id}"><span class="mi">${esc(b.icon)}</span>${esc(b.name)}</button>`).join('') +
            '<hr><button data-b="">Keinem Bereich</button>', innerWidth / 2 - 120, 160);
          m.addEventListener('click', e => {
            const b = elVon(e)?.closest<HTMLElement>('button[data-b]');
            if (!b) return;
            Store.updateBlock(id, { bereich: b.dataset.b });
            m.remove(); App.zeichneBaum();
            UI.toast('Zugeordnet');
          });
        });
      },
      /**
       * HIER STAND `v.slice(5)`. Ein Knopf, der ohne Rückfrage fünf Fassungen
       * je Seite behielt und alle übrigen endgültig löschte — bei einer Seite
       * mit dreissig Fassungen also fünfundzwanzig, unwiederbringlich, mit
       * einem Klick. Das war eine dritte Zahl neben `slice(30)` und
       * `VERSIONEN_MAX: 200`, und die schärfste von allen.
       *
       * Jetzt wendet der Knopf dieselbe Regel an wie das Speichern, nur
       * sofort statt beim nächsten Mal: ausdünnen, nicht abschneiden. Und er
       * fragt vorher — mit der Zahl, um die es geht.
       */
      'versionen-aufraeumen': async () => {
        const opfer: any[] = [];
        try {
          for (const p of Links.seiten()) {
            const v = await Store.versionen(p.id);
            Store.fassungenAusduennen(v).forEach(id => opfer.push(id));
          }
        } catch (err) {
          /* Auf halbem Weg abbrechen ist hier richtig: was schon in `opfer`
             steht, ist nur eine Auswahl aus den Seiten, die lesbar waren.
             Danach zu löschen hiesse, nach einem unvollständigen Bild zu
             handeln — und gelöschte Fassungen kommen nicht wieder. */
          UI.toast('Der Verlauf ist gerade nicht lesbar — es wurde nichts gelöscht');
          if (typeof Reporter !== 'undefined')
            Reporter.error('einstellungen', 'Aufräumen abgebrochen: Verlauf nicht lesbar', err);
          return;
        }
        if (!opfer.length) { UI.toast('Der Verlauf ist schon aufgeräumt — nichts zu tun'); return; }
        if (!confirm(`${opfer.length} alte Fassungen endgültig löschen? ` +
                     'Behalten werden die jüngsten, danach eine je Tag und eine je Monat. ' +
                     'Von Hand gesicherte Fassungen bleiben alle.')) return;
        for (const id of opfer) await Store.versionLoeschen(id);
        UI.toast(opfer.length + ' alte Fassungen entfernt');
      },
      'speicher-sichern': async () => {
        if (!navigator.storage?.persist) { UI.toast('Der Browser kann das nicht'); return; }
        const ok = await navigator.storage.persist();
        UI.toast(ok ? 'Der Speicher ist jetzt dauerhaft' : 'Der Browser hat abgelehnt');
      },
      'alles-loeschen': async () => {
        if (!confirm('Wirklich ALLE Seiten und Datenbanken löschen?')) return;
        if (!confirm('Ganz sicher? Am besten vorher eine Sicherung speichern.')) return;
        /* Kein Neuladen, wenn es nicht ganz geklappt hat: nach dem Neuladen
           sähe der Bildschirm leer aus, und genau das wäre die Lüge — die
           Daten wären noch da. Lieber stehen bleiben und es sagen. */
        try { await Store.wipe(); }
        catch (err) {
          alert(err instanceof Error ? err.message : 'Es liess sich nicht alles löschen.');
          return;
        }
        location.reload();
      }
    };
    const tuIt = (karte as Record<string, () => any>)[was];
    if (tuIt) await tuIt();
  };

  /* ========================================================================
   * WAS BEIM START GILT
   * ======================================================================*/
  const start = () => {
    anwenden();
    if (V('seiteZu', false)) document.getElementById('sidebar')?.classList.add('collapsed');

    /* FÄLLIGE KARTEIKARTEN MELDEN — EINMAL AM TAG, NICHT BEI JEDEM START.
     *
     * Der Schalter dazu gibt es seit jeher („Karteikarten · Beim Start
     * melden"), und er stand auf an. Nur meldete es bei JEDEM Öffnen und
     * bei jedem Neuladen — wer an Redion arbeitet, sah den Streifen
     * vierzigmal am Tag, und wer ihn wegdrücken wollte, musste die
     * ganze Meldung abschalten.
     *
     * Eine Erinnerung, die man schon kennt, ist keine Erinnerung mehr.
     * Also merkt sie sich den TAG, an dem sie gezeigt wurde.
     *
     * Der Merker wird nur gesetzt, wenn wirklich etwas gezeigt wurde. Sonst
     * würde ein Start um 8 Uhr ohne fällige Karten die Meldung um 14 Uhr
     * verschlucken, wenn dann welche fällig sind. */
    /* AUS, BIS ER SIE EINSCHALTET (E409). Die Vorgabe war an, und damit stand
       der Streifen bei jedem ersten Start des Tages unten in der Mitte — auch
       über jedem Bildschirmfoto und über dem, was gerade gebaut wurde. Eine
       Meldung, um die niemand gebeten hat, ist Werbung, keine Erinnerung. */
    if (V('kartenMelden', false)) {
      const heute3 = new Date().toISOString().slice(0, 10);
      if (Store.getMeta('kartenGemeldet', '') !== heute3) {
        const n = Werkzeuge.faellig().length;
        if (n) {
          Store.setMeta('kartenGemeldet', heute3);
          setTimeout(() => UI.toast('🎴 ' + n +
            (n === 1 ? ' Karteikarte ist fällig' : ' Karteikarten sind fällig')), 1800);
        }
      }
    }
  };

  return { oeffne, start, anwenden, datum, wochenstart, V, S, GRUPPEN, BEREICHE };
})();

(window as any).Einstellungen = Einstellungen;
