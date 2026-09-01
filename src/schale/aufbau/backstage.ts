/* ============================================================================
 * backstage.js — „Datei": eine Fläche statt eines Menübands
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/backstage.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/backstage.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM „DATEI" KEIN REITER IST (E272 Phase G).
 *
 * Die anderen acht Reiter zeigen Befehle, die auf das wirken, was gerade
 * offen ist — fett machen, einen Block einfügen, eine Linie ziehen. „Datei"
 * wirkt auf das Ganze: sichern, drucken, weitergeben, das Konto, die
 * Einstellungen. Office trennt das seit 2010 in eine eigene Fläche, und der
 * Grund ist nicht Geschmack: wer eine Sicherung schreibt, tut das nicht
 * nebenbei zwischen zwei Sätzen. Die Fläche nimmt den Bildschirm, sagt in
 * ganzen Sätzen, was Sache ist, und geht wieder.
 *
 * WAS HIER NEU IST: NICHTS AUSSER DER FLÄCHE.
 *
 * Jede Zeile ruft einen Dienst, den es schon gibt. Es gibt hier keinen
 * eigenen Erstellcode, keine zweite Sicherungsmaschine, keinen eigenen
 * Exportweg — das wäre genau die Doppelung, gegen die §8 geschrieben ist.
 * Die Bindungen stehen namentlich in `doku/PREMIUM-SHELL-MATRIX.md`, Teil 3,
 * und `pruefungen/lauf/test272.mts` §13 misst nach, dass sie halten.
 *
 * DREI DINGE, DIE HIER ABSICHT SIND
 *
 *   · SIE IST EINE `.overlay`, DIE GEBAUT UND WIEDER ENTFERNT WIRD.
 *     Der Plan sah eine feste, versteckte Wurzel in `index.html` vor. Beim
 *     Nachsehen war das der schlechtere Weg: `schale/ueberlagerung/fokus.ts`
 *     (E223) beobachtet, was an `<body>` gehängt wird, und legt jeder neuen
 *     Überlagerung auf, was ihr fehlt — `role`, `aria-modal`, den Fokus
 *     hinein, Tabulator im Kreis, den Fokus beim Schliessen zurück, und
 *     `inert` auf allem dahinter. Ein Kasten, der nur sein `hidden`
 *     wegnimmt, bekommt davon nichts: er wird nie „hinzugefügt". Wer die
 *     feste Wurzel wollte, müsste sechs Dinge von Hand nachbauen, die es an
 *     einer Stelle schon richtig gibt.
 *
 *   · SIE VERSPRICHT NICHTS, WAS SIE NICHT HAT (§47).
 *     „Drucken" ohne offene Seite ist kein Knopf, der bedauert — es steht
 *     ein Satz da, der sagt, was fehlt. „Automatisch in einen Ordner"
 *     erscheint nur, wo der Browser es kann (Safari auf dem iPhone und
 *     Firefox können es nicht). Und die Sektion heisst „Weitergeben" und
 *     nicht „Senden": `Mail.senden` gibt es nicht, das Mail-Modul kann
 *     lesen und antworten, aber nicht verschicken (Matrix, Teil 3).
 *
 *   · SIE HEISST `bst-` UND NICHT `bs-`.
 *     Der erste Entwurf nahm `bs-` — und `bs-` ist seit dem Formelbuch die
 *     BUCHSEITE: `.bs-zeile`, `.bs-kopf`, `.bs-inhalt`, `.bs-groessen`
 *     stehen alle in `bausteine.css`. Gemessen war der Unterzeile jeder
 *     Datei-Zeile deshalb `font-weight:600` statt `400` und die Farbe
 *     `--text` statt `--text-muted`: die Buchseiten-Regel gewann. Gefunden
 *     wurde es nicht von einem Prüflauf, sondern auf dem Bild (§55).
 *
 *   · SIE ERFINDET KEINE ZAHL.
 *     `Sicherung.platz()` ist ein Versprechen und kann `bekannt:false`
 *     zurückgeben. Dann steht kein Balken da und keine geschätzte Zahl,
 *     sondern der Satz, dass dieser Browser es nicht sagt. Eine erfundene
 *     Belegung wäre schlimmer als keine — man richtet sich danach.
 * ==========================================================================*/

const Backstage = (() => {

  /** Ein Fach der linken Spalte. `da()` fehlt = immer da. */
  type Sektion = {
    id: string;
    name: string;
    /** Fehlt sie, ist das Fach in dieser Fassung nicht geladen. */
    da?: () => boolean;
    /** Zeichnet die rechte Fläche. Gibt HTML zurück, das `fuellen` einsetzt. */
    zeichne: () => string;
  };

  const WURZEL = 'backstage';

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /** Gibt es das Modul, und kann es, was gefragt ist? */
  const kann = (f: () => unknown): boolean => {
    try { return typeof f() === 'function'; } catch { return false; }
  };
  const holen = (name: string): any => {
    try { return (globalThis as any)[name]; } catch { return undefined; }
  };

  /**
   * Ein Zeitpunkt, wie ein Mensch ihn liest.
   *
   * `.slice(0,16).replace('T',' ')` stand hier zuerst und ergab
   * „2026-08-30 22:04" — auf dem Bild sofort als Maschinenschrift zu
   * erkennen. Redion schreibt Daten sonst überall in `de-CH`
   * (`datenbanken/raster.ts:113`, `einstellungen/…/seite.ts:494`), und
   * eine Fläche, die als einzige ISO spricht, wirkt wie ein Protokoll.
   */
  const wann = (iso: unknown): string => {
    const t = Date.parse(String(iso ?? ''));
    if (Number.isNaN(t)) return '—';
    return new Date(t).toLocaleString('de-CH',
      { day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit' });
  };

  /** Die offene Seite als Block — oder nichts. */
  const seiteJetzt = (): any => {
    try {
      const id = App.aktuelleSeite();
      if (!id) return null;
      return Store.getBlock(id) || null;
    } catch { return null; }
  };

  /* ══════════════════════════════════════════════════════════════════════
     BAUSTEINE DER RECHTEN FLÄCHE
     ────────────────────────────────────────────────────────────────────
     Vier Formen, mehr braucht keine Sektion. Sie tragen alle dieselbe
     Datenmarke `data-bst-tun`, damit ein einziger Klickhorcher genügt —
     neun Sektionen mit neun Horchern wären neun Stellen zum Vergessen.
     ══════════════════════════════════════════════════════════════════════ */

  const kopf = (titel: string, unter = ''): string =>
    `<h2 class="bst-titel">${esc(titel)}</h2>` +
    (unter ? `<p class="bst-unter">${esc(unter)}</p>` : '');

  /** Eine grosse Handlungskachel. */
  const kachel = (tun: string, zeichen: string, name: string, sub: string): string =>
    `<button class="bst-kachel" data-bst-tun="${esc(tun)}">` +
    `<span class="bst-k-z" aria-hidden="true">${esc(zeichen)}</span>` +
    `<span class="bst-k-t"><b>${esc(name)}</b><i>${esc(sub)}</i></span></button>`;

  /** Eine Zeile in einer Liste. */
  const zeile = (tun: string, name: string, sub = ''): string =>
    `<button class="bst-zeile" data-bst-tun="${esc(tun)}">` +
    `<span class="bst-z-t"><b>${esc(name)}</b>` +
    (sub ? `<i>${esc(sub)}</i>` : '') + '</span>' +
    '<span class="bst-z-pfeil" aria-hidden="true">›</span></button>';

  /** Eine Auskunft ohne Handlung — Text, kein Knopf. */
  const auskunft = (name: string, wert: string, ton = ''): string =>
    `<div class="bst-fakt${ton ? ' ist-' + esc(ton) : ''}">` +
    `<b>${esc(name)}</b><span>${esc(wert)}</span></div>`;

  const gruppe = (name: string, inhalt: string): string =>
    inhalt ? `<div class="bst-grp">${esc(name)}</div>${inhalt}` : '';

  /* ══════════════════════════════════════════════════════════════════════
     DIE NEUN FÄCHER
     ══════════════════════════════════════════════════════════════════════ */

  const SEKTIONEN: Sektion[] = [

    /* ── Informationen ────────────────────────────────────────────────── */
    { id: 'info', name: 'Informationen', zeichne: () => {
      const p = seiteJetzt();
      let aus = kopf('Informationen',
        'Was Redion gerade hält, und wie gut es gesichert ist.');

      /* Die offene Seite. Steht keine offen, ist das kein Fehler — dann
         steht hier eben nichts über sie. */
      if (p) {
        aus += gruppe('Diese Seite',
          auskunft('Titel', String(p.text || 'Ohne Titel')) +
          auskunft('Zuletzt geändert', wann(p.edited || p.created)) +
          (p.locked ? auskunft('Gesperrt', 'Ja — Bearbeiten ist aus', 'warnen') : ''));
      }

      /* Der Sicherungsstand. `tage: null` heisst UNBEKANNT und nicht
         „null Tage" — der Satz muss beides auseinanderhalten. */
      const s = holen('Sicherung');
      if (s && typeof s.stand === 'function') {
        const st = s.stand();
        const satz = st.tage === null
          ? 'Noch keine Sicherung bekannt.'
          : st.tage === 0 ? 'Heute gesichert.'
          : 'Vor ' + st.tage + (st.tage === 1 ? ' Tag' : ' Tagen') + ' gesichert.';
        const ton = st.stufe === 'gut' ? '' : st.stufe;
        aus += gruppe('Sicherung',
          auskunft('Letzte Sicherung', satz + (st.art ? ' (' + st.art + ')' : ''), ton) +
          zeile('kopie', 'Jetzt eine Kopie speichern',
                'Geht zu „Kopie speichern"'));
      }

      /* Der Ordner (E270). ERST `moeglich()`, DANN `an()`: wo der Browser
         es nicht kann, wäre auch ein „Aus" eine falsche Auskunft — es ist
         nicht aus, es gibt es dort nicht. */
      const os = holen('OrdnerSicherung');
      if (os && typeof os.moeglich === 'function') {
        if (!os.moeglich()) {
          aus += gruppe('Automatische Sicherung',
            auskunft('Ordner', 'Dieser Browser kann keinen Ordner behalten.'));
        } else if (os.an()) {
          aus += gruppe('Automatische Sicherung',
            auskunft('Ordner', String(os.name() || 'gewählt')) +
            auskunft('Zuletzt geschrieben',
                     os.zuletzt() ? wann(os.zuletzt()) : 'noch nicht') +
            (os.fehler() ? auskunft('Letzter Fehler', String(os.fehler()), 'warnen') : ''));
        } else {
          aus += gruppe('Automatische Sicherung',
            auskunft('Ordner', 'Aus — Redion schreibt nichts von selbst.'));
        }
      }

      /* Der Platz. Asynchron: hier steht erst ein Platzhalter, `platzNach`
         trägt die Zahl nach. Steht sie nie, bleibt der ehrliche Satz. */
      aus += gruppe('Auf diesem Gerät',
        '<div class="bst-fakt" id="bst-platz"><b>Belegter Platz</b>' +
        '<span>wird gemessen …</span></div>');

      /* DER ABGLEICH — und zwar von den Griffen, die es GIBT.
         `Wolke` hat kein `stand()`; es hat `angemeldet()` und `adresse()`.
         Ein Zweig auf einen erfundenen Namen wäre für immer tot gewesen
         und hätte grün ausgesehen, weil `typeof` ihn wegfängt. */
      const w = holen('Wolke');
      if (w && typeof w.angemeldet === 'function') {
        try {
          aus += gruppe('Abgleich', w.angemeldet()
            ? auskunft('Server', String(w.adresse?.() || 'verbunden'))
            : auskunft('Server', 'Nicht angemeldet — alles bleibt auf diesem Gerät.'));
        } catch { /* ohne Wolke steht hier nichts, und das ist richtig */ }
      }
      return aus;
    } },

    /* ── Neu ──────────────────────────────────────────────────────────── */
    { id: 'neu', name: 'Neu', zeichne: () => {
      /* KEIN EIGENER KATALOG. `App.erstellenWege()` ist seit E265 der
         gefilterte Bestand — gefiltert heisst: was diese Fassung wirklich
         geladen hat. Eine zweite Liste hier hiesse, jeden neuen Weg an zwei
         Stellen nachzutragen, und die zweite vergisst man. */
      let wege: any[] = [];
      try { wege = App.erstellenWege() || []; } catch { wege = []; }
      if (!wege.length) return kopf('Neu', 'Es ist gerade kein Weg geladen.');
      return kopf('Neu', 'Womit soll es losgehen?') +
        '<div class="bst-kacheln">' +
        wege.map(w => kachel('neu:' + w.id, w.zeichen, w.name, w.sub)).join('') +
        '</div>';
    } },

    /* ── Öffnen ───────────────────────────────────────────────────────── */
    { id: 'oeffnen', name: 'Öffnen', zeichne: () => {
      let aus = kopf('Öffnen', 'Wo etwas liegt, das es schon gibt.');
      aus += gruppe('Orte',
        (kann(() => holen('Bibliothek')?.oeffne)
          ? zeile('ort:bibliothek', 'Bibliothek', 'Fächer, Notizbücher, Dokumente') : '') +
        (kann(() => holen('Notebook')?.oeffnen)
          ? zeile('ort:notizhefte', 'Notizhefte', 'Das Regal mit den Deckeln') : '') +
        zeile('ort:suche', 'Suchen', 'Über alle Seiten und Inhalte (Strg + P)'));

      /* Zuletzt geöffnet — echte Liste, keine erfundene. */
      let letzte: any[] = [];
      try { letzte = (App.kuerzlich() || []).slice(0, 8); } catch { letzte = []; }
      if (letzte.length) aus += gruppe('Zuletzt geöffnet',
        letzte.map(b => zeile('seite:' + b.id, String(b.text || 'Ohne Titel'))).join(''));
      return aus;
    } },

    /* ── Kopie speichern ──────────────────────────────────────────────── */
    { id: 'kopie', name: 'Kopie speichern', zeichne: () => {
      let aus = kopf('Kopie speichern',
        'Eine Sicherung ist eine Datei auf deinem Gerät. Redion lädt sie ' +
        'herunter; wohin sie geht, entscheidet der Browser.');
      aus += gruppe('Von Hand',
        zeile('sich:speichern', 'Sicherung speichern',
              'Alles in eine Datei — mit Anhängen als .redion') +
        zeile('sich:laden', 'Sicherung einlesen',
              'Eine gespeicherte Datei zurückholen'));

      const os = holen('OrdnerSicherung');
      if (os && typeof os.moeglich === 'function' && os.moeglich()) {
        aus += gruppe('Automatisch (E270)',
          (os.an()
            ? zeile('ord:jetzt', 'Jetzt in den Ordner sichern',
                    'Ordner: ' + String(os.name() || 'gewählt'))
            : zeile('ord:waehlen', 'Ordner wählen',
                    'Danach alle fünf Minuten, aber nur bei Änderungen')));
      }
      return aus;
    } },

    /* ── Drucken ──────────────────────────────────────────────────────── */
    { id: 'drucken', name: 'Drucken', zeichne: () => {
      const p = seiteJetzt();
      /* §47: kein Knopf, der bedauert. Ohne offene Seite steht hier der
         Satz, was fehlt — und der Weg dahin. */
      if (!p) return kopf('Drucken',
        'Gedruckt wird eine Seite. Gerade ist keine offen.') +
        gruppe('Zuerst', zeile('ort:bibliothek', 'Eine Seite öffnen',
                               'Geht zur Bibliothek'));
      return kopf('Drucken', 'Der Browser zeigt die Vorschau und kann auch ' +
                  'als PDF speichern.') +
        gruppe('Diese Seite',
          zeile('druck:seite', 'Drucken oder als PDF speichern',
                String(p.text || 'Ohne Titel')));
    } },

    /* ── Weitergeben ──────────────────────────────────────────────────── */
    { id: 'weitergeben', name: 'Weitergeben', zeichne: () => {
      /* SIE HEISST NICHT „SENDEN". `Mail.senden` gibt es nicht; das
         Mail-Modul kann lesen und antworten, aber nicht verschicken
         (Matrix Teil 3). Ein Knopf „Senden", der nichts sendet, wäre
         genau die Enttäuschung, gegen die `zeigen()` gebaut wurde. */
      const p = seiteJetzt();
      if (!p) return kopf('Weitergeben',
        'Weitergegeben wird eine Seite. Gerade ist keine offen.') +
        gruppe('Zuerst', zeile('ort:bibliothek', 'Eine Seite öffnen',
                               'Geht zur Bibliothek'));
      return kopf('Weitergeben',
                  'Alle Wege stehen im Teilen-Menü: Link, Text, Markdown, ' +
                  'HTML, PDF, Word, Excel, Obsidian.') +
        gruppe('Diese Seite',
          zeile('teil:menue', 'Teilen …', String(p.text || 'Ohne Titel')) +
          zeile('teil:link', 'Link auf diese Seite kopieren',
                'Öffnet dieses Gerät an dieser Stelle'));
    } },

    /* ── Exportieren ──────────────────────────────────────────────────── */
    { id: 'export', name: 'Exportieren', zeichne: () => {
      const p = seiteJetzt();
      let aus = kopf('Exportieren',
        'Ein Export ist kein Ersatz für eine Sicherung: er nimmt den Text ' +
        'mit, nicht den Zustand der App.');
      if (p) aus += gruppe('Diese Seite',
        zeile('exp:md', 'Als Markdown speichern', String(p.text || 'Ohne Titel')) +
        (kann(() => holen('Werkzeuge')?.htmlExport)
          ? zeile('exp:html', 'Als HTML speichern', '') : '') +
        /* L69: die Berufsschule verlangt oft eine Abgabe, und der
           Vortragsmodus lebt nur in Redion. */
        (kann(() => holen('Austausch')?.alsPowerPoint)
          ? zeile('exp:pptx', 'Als PowerPoint speichern',
                  'Die Folien dieser Seite als .pptx') : ''));
      aus += gruppe('Alles',
        (kann(() => holen('Werkzeuge')?.einzelDatei)
          ? zeile('exp:einzel', 'Alles als eine HTML-Datei',
                  'Zum Lesen ohne Redion') : '') +
        (kann(() => holen('Werkzeuge')?.ordnerSchreiben)
          ? zeile('exp:ordner', 'Alles in einen Ordner schreiben',
                  'Je Seite eine Markdown-Datei') : ''));
      return aus;
    } },

    /* ── Konto ────────────────────────────────────────────────────────── */
    { id: 'konto', name: 'Konto', zeichne: () => {
      let aus = kopf('Konto',
        'Redion läuft ohne Konto. Eines gibt es nur, wenn du es willst — ' +
        'für den Abgleich zwischen Geräten.');
      aus += gruppe('Redion',
        (kann(() => holen('WolkeFenster')?.dialog)
          ? zeile('konto:wolke', 'Redion-Konto und Abgleich',
                  'Anmelden, Geräte, Serveradresse') : '') +
        zeile('konto:arbeitsbereich', 'Arbeitsbereich',
              'Name und Zeichen dieses Bereichs'));
      /* Drittkonten sind ein ANDERES Ding als das Redion-Konto — Google,
         GitHub, Jira. Sie in einen Topf zu werfen hiesse, „abmelden" zu
         verwechseln. */
      if (kann(() => holen('Verbindungen')?.dialog))
        aus += gruppe('Andere Dienste',
          zeile('konto:verbindungen', 'Verbindungen',
                'Google, GitHub, Jira und die übrigen'));
      return aus;
    } },

    /* ── Optionen ─────────────────────────────────────────────────────── */
    { id: 'optionen', name: 'Optionen', zeichne: () =>
      kopf('Optionen', 'Alles, was Redion für dich merkt.') +
      gruppe('Einstellungen',
        zeile('opt:einstellungen', 'Einstellungen öffnen',
              'Aussehen, Bereiche, Daten, Pflege, Erweiterungen') +
        (kann(() => holen('Aussehen')?.dialog)
          ? zeile('opt:aussehen', 'Aussehen', 'Farben, Schrift, Tastenkürzel') : '') +
        zeile('opt:thema', 'Hell oder dunkel umschalten', 'Strg + Umschalt + L') +
        (kann(() => holen('Werkzeuge')?.tastenkuerzel)
          ? zeile('opt:tasten', 'Tastenkürzel anzeigen', 'Strg + /') : '')) }
  ];

  /** Die Fächer, die diese Fassung wirklich hat. */
  const faecher = (): Sektion[] => SEKTIONEN.filter(s => !s.da || s.da());

  /* ══════════════════════════════════════════════════════════════════════
     DIE HANDLUNGEN
     ────────────────────────────────────────────────────────────────────
     Eine Karte statt einer Kette von `if`. Jede Zeile ruft genau einen
     fremden Dienst; was hier steht, ist die Verdrahtung und nicht die
     Sache selbst.
     ══════════════════════════════════════════════════════════════════════ */

  /** Erst schliessen, dann handeln — ein Dialog unter der Fläche wäre
   *  von aussen nicht erreichbar (derselbe Grund wie im R-Blatt). */
  const zuUnd = (f: () => void): void => { schliesse(); setTimeout(f, 60); };

  const tun = (was: string): void => {
    /* Die Wege mit Doppelpunkt zuerst: sie tragen ein Ziel bei sich. */
    if (was.startsWith('neu:'))   { zuUnd(() => App.erstellenWeg(was.slice(4))); return; }
    if (was.startsWith('seite:')) { zuUnd(() => App.oeffne(was.slice(6))); return; }

    const karte: Record<string, () => void> = {
      /* Nur die Sektion wechseln — die Fläche bleibt stehen. */
      'kopie': () => zeige('kopie'),

      'ort:bibliothek':   () => zuUnd(() => holen('Bibliothek')?.oeffne?.()),
      'ort:notizhefte':   () => zuUnd(() => holen('Notebook')?.oeffnen?.()),
      'ort:suche':        () => zuUnd(() => App.suche()),

      'sich:speichern':   () => zuUnd(() => { void App.sicherungSpeichern(); }),
      'sich:laden':       () => zuUnd(() => App.sicherungLaden()),
      'ord:waehlen':      () => zuUnd(() => { void holen('OrdnerSicherung')?.waehlen?.(); }),
      'ord:jetzt':        () => {
        const os = holen('OrdnerSicherung');
        if (!os?.jetztSichern) return;
        try { UI.toast('Sicherung wird geschrieben …'); } catch { /* ohne Hinweis geht es auch */ }
        Promise.resolve(os.jetztSichern(true)).then(() => neuZeichnen()).catch(() => {});
      },

      'druck:seite':      () => { const p = seiteJetzt();
                                  if (p) zuUnd(() => { void holen('Werkzeuge')?.drucken?.(p); }); },
      'teil:menue':       () => { const p = seiteJetzt();
                                  if (p) zuUnd(() => {
                                    const anker = document.getElementById('btn-page-menu')
                                      || document.getElementById('mb-datei');
                                    holen('Werkzeuge')?.teilenMenue?.(anker, p);
                                  }); },
      'teil:link':        () => { const p = seiteJetzt();
                                  if (!p) return;
                                  zuUnd(() => holen('Ablage')?.kopiereJetzt?.(
                                    location.origin + location.pathname + '#' + p.id,
                                    'Link zur Seite kopiert')); },

      'exp:md':           () => { const p = seiteJetzt();
                                  if (p) zuUnd(() => App.markdownExport(p)); },
      'exp:html':         () => { const p = seiteJetzt();
                                  if (p) zuUnd(() => holen('Werkzeuge')?.htmlExport?.(p)); },
      'exp:pptx':         () => { const p = seiteJetzt();
                                  if (p) zuUnd(() => {
                                    void holen('Austausch')?.alsPowerPoint?.(p)
                                      .then((e: any) => UI.toast(
                                        e.folien + (e.folien === 1 ? ' Folie' : ' Folien') +
                                        ' gespeichert'))
                                      .catch((f: unknown) => UI.toast(
                                        'Die PowerPoint-Datei kam nicht zustande: ' +
                                        (f instanceof Error ? f.message : String(f))));
                                  }); },
      'exp:einzel':       () => zuUnd(() => holen('Werkzeuge')?.einzelDatei?.()),
      'exp:ordner':       () => zuUnd(() => holen('Werkzeuge')?.ordnerSchreiben?.()),

      'konto:wolke':          () => zuUnd(() => holen('WolkeFenster')?.dialog?.()),
      'konto:verbindungen':   () => zuUnd(() => holen('Verbindungen')?.dialog?.()),
      /* NICHT `App.arbeitsbereich()` — das führt am Rechner seit dieser
         Phase hierher zurück und wäre eine Schleife. Der Arbeitsbereich
         wird in den Einstellungen benannt. */
      'konto:arbeitsbereich': () => zuUnd(() => holen('Einstellungen')?.oeffne?.('arbeitsplatz')),

      'opt:einstellungen': () => zuUnd(() => holen('Einstellungen')?.oeffne?.()),
      'opt:aussehen':      () => zuUnd(() => holen('Aussehen')?.dialog?.()),
      'opt:thema':         () => { try { App.theme(); } catch { /* Thema bleibt */ } },
      'opt:tasten':        () => zuUnd(() => holen('Werkzeuge')?.tastenkuerzel?.())
    };
    const f = karte[was];
    if (f) { try { f(); } catch { /* ein toter Dienst schliesst nicht die Fläche */ } }
  };

  /* ══════════════════════════════════════════════════════════════════════
     DIE FLÄCHE
     ══════════════════════════════════════════════════════════════════════ */

  let gewaehlt = 'info';

  const wurzel = (): HTMLElement | null => document.getElementById(WURZEL);

  const offen = (): boolean => !!wurzel();

  /** Den Platz nachtragen, sobald der Browser antwortet. */
  const platzNach = (): void => {
    const s = holen('Sicherung');
    if (!s?.platz) return;
    Promise.resolve(s.platz()).then((z: any) => {
      const feld = document.getElementById('bst-platz');
      if (!feld) return;                      /* inzwischen weitergeklickt */
      const wert = feld.querySelector('span');
      if (!wert) return;
      /* KEINE ERFUNDENE ZAHL. `bekannt:false` heisst: dieser Browser sagt
         es nicht. Dann steht das da und kein geschätzter Balken. */
      if (!z || !z.bekannt) {
        wert.textContent = 'Dieser Browser sagt es nicht.';
        return;
      }
      const g = (b: number) => s.groesse(b);
      wert.textContent = g(z.belegt) + ' belegt · ' + g(z.frei) + ' frei'
        + (z.anhaenge ? ' · ' + z.anhaenge + ' Anhänge' : '');
    }).catch(() => {});
  };

  /** Die rechte Fläche neu zeichnen. */
  const fuellen = (): void => {
    const w = wurzel();
    if (!w) return;
    const flaeche = w.querySelector<HTMLElement>('.bst-flaeche');
    if (!flaeche) return;
    const s = faecher().find(x => x.id === gewaehlt) || faecher()[0];
    if (!s) return;
    try { flaeche.innerHTML = s.zeichne(); }
    catch { flaeche.innerHTML = kopf('Nicht verfügbar',
      'Dieses Fach lässt sich gerade nicht zeichnen.'); }
    flaeche.scrollTop = 0;
    w.querySelectorAll<HTMLElement>('.bst-nav-knopf').forEach(k => {
      const an = k.dataset['bst'] === s.id;
      k.classList.toggle('ist-an', an);
      k.setAttribute('aria-current', an ? 'page' : 'false');
    });
    if (s.id === 'info') platzNach();
  };

  /** Ein anderes Fach zeigen. */
  const zeige = (id: string): void => {
    if (faecher().some(s => s.id === id)) gewaehlt = id;
    fuellen();
  };

  const neuZeichnen = (): void => { if (offen()) fuellen(); };

  const schliesse = (): void => { wurzel()?.remove(); };

  /**
   * Aufmachen.
   *
   * Zweimal aufrufen wechselt nur das Fach — zwei Flächen übereinander
   * wären zwei Fokusfallen, und die zweite gewönne.
   */
  const oeffne = (sektion?: string): void => {
    if (offen()) { if (sektion) zeige(sektion); return; }
    if (sektion && faecher().some(s => s.id === sektion)) gewaehlt = sektion;

    const grund = document.createElement('div');
    /* `.overlay` ist kein Zierrat: `schale/ueberlagerung/fokus.ts` erkennt
       daran den Dialog und legt Rolle, `aria-modal`, Fokus, Tabulatorkreis
       und `inert` auf. Und `schale.ts` schliesst `.overlay` mit Esc. */
    grund.className = 'overlay bst-grund';
    grund.id = WURZEL;

    const kasten = document.createElement('div');
    kasten.className = 'backstage';

    const nav = document.createElement('nav');
    nav.className = 'bst-nav';
    nav.setAttribute('aria-label', 'Datei');

    const zurueck = document.createElement('button');
    zurueck.type = 'button';
    zurueck.className = 'bst-zurueck';
    zurueck.innerHTML = '<span aria-hidden="true">←</span><span>Zurück</span>';
    zurueck.setAttribute('aria-label', 'Datei schliessen (Esc)');
    zurueck.addEventListener('click', () => schliesse());
    nav.appendChild(zurueck);

    faecher().forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bst-nav-knopf';
      b.dataset['bst'] = s.id;
      b.textContent = s.name;
      b.addEventListener('click', () => zeige(s.id));
      nav.appendChild(b);
    });

    const flaeche = document.createElement('section');
    flaeche.className = 'bst-flaeche';
    flaeche.tabIndex = -1;
    /* EIN HORCHER FÜR NEUN FÄCHER. Die Zeilen werden bei jedem
       Fachwechsel neu geschrieben; ein Horcher je Knopf hiesse, ihn bei
       jedem Wechsel neu zu hängen — und einmal zu vergessen. */
    flaeche.addEventListener('click', (e: Event) => {
      const b = (e.target instanceof Element)
        ? e.target.closest<HTMLElement>('[data-bst-tun]') : null;
      if (!b) return;
      tun(String(b.dataset['bstTun'] || ''));
    });

    kasten.appendChild(nav);
    kasten.appendChild(flaeche);
    grund.appendChild(kasten);

    /* Ein Klick auf den Grund NEBEN dem Kasten schliesst. Am Rechner füllt
       der Kasten die Fläche ganz; am Telefon bleibt oben ein Streifen. */
    grund.addEventListener('click', (e: Event) => {
      if (e.target === grund) schliesse();
    });

    document.body.appendChild(grund);
    fuellen();
  };

  /** Auf oder zu, für den Knopf in der Reiterzeile. */
  const schalten = (): void => { if (offen()) schliesse(); else oeffne(); };

  return { oeffne, schliesse, schalten, offen, zeige, neuZeichnen,
           /* Für Prüfläufe: welche Fächer diese Fassung hat. */
           faecher: () => faecher().map(s => ({ id: s.id, name: s.name })) };
})();

(window as any).Backstage = Backstage;
