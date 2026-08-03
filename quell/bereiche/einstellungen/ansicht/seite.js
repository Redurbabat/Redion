/* ============================================================================
 * einstellungen.js — Der Einstellungsbereich
 * ----------------------------------------------------------------------------
 * Nach Notions Vorbild aufgebaut: links die Bereiche, rechts die Optionen.
 * Was bei Notion nur mit Konto und Server geht (Mitglieder, Abrechnung,
 * SSO), steht hier als das da, was es lokal bedeutet — ehrlich benannt,
 * nicht weggelassen.
 * ==========================================================================*/

const Einstellungen = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* Alles, was hier eingestellt wird, liegt in meta. */
  const V = (k, fallback) => Store.getMeta(k, fallback);
  const S = (k, v) => { Store.setMeta(k, v); anwenden(); };

  /* Wie in Notion in Abschnitte geordnet, nicht als eine lange Liste. */
  const GRUPPEN = [
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
    if (window.Aussehen) Aussehen.anwenden();
  };

  /** Datum so ausgeben, wie es eingestellt ist. */
  const datum = (wert, mitZeit = false) => {
    if (!wert) return '';
    const d = new Date(wert);
    if (isNaN(d)) return String(wert);
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

  const oeffne = (bereich) => {
    offenerBereich = bereich || offenerBereich;
    document.querySelectorAll('.overlay').forEach(o => o.remove());

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="einst-fenster">' +
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
        '<div class="einst-inhalt" id="ei"></div>' +
        '<button class="einst-zu" data-a="zu">✕</button>' +
      '</div>';
    document.body.appendChild(o);

    const zeichne = () => {
      o.querySelector('#ei').innerHTML = inhalt(offenerBereich);
      o.querySelectorAll('.einst-nav button').forEach(b =>
        b.classList.toggle('on', b.dataset.b === offenerBereich));
      binde(o);
    };
    zeichne();

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const b = e.target.closest('.einst-nav button[data-b]');
      if (b) { offenerBereich = b.dataset.b; zeichne(); }
    });
    o.neuZeichnen = zeichne;
  };

  /* --- Bausteine ---------------------------------------------------------- */
  const zeile = (titel, beschreibung, steuerung) =>
    `<div class="ez-zeile"><div class="ez-text"><b>${titel}</b>` +
    (beschreibung ? `<span>${beschreibung}</span>` : '') + '</div>' +
    `<div class="ez-steuer">${steuerung}</div></div>`;

  const wahl = (schluessel, werte, jetzt) =>
    `<select data-set="${schluessel}">` +
    werte.map(w => {
      const [wert, name] = Array.isArray(w) ? w : [w, w];
      return `<option value="${esc(wert)}"${wert === jetzt ? ' selected' : ''}>${esc(name)}</option>`;
    }).join('') + '</select>';

  const schalter = (schluessel, an) =>
    `<button class="schalter${an ? ' an' : ''}" data-toggle="${schluessel}"><i></i></button>`;

  const knopf = (aktion, text, klasse = '') =>
    `<button class="ez-knopf ${klasse}" data-tun="${aktion}">${text}</button>`;

  const feld = (schluessel, wert, platzhalter = '') =>
    `<input data-set="${schluessel}" value="${esc(wert)}" placeholder="${esc(platzhalter)}">`;

  const kopf = (titel, unter) =>
    `<h2>${titel}</h2>` + (unter ? `<p class="ez-unter">${unter}</p>` : '');

  /* ========================================================================
   * DIE EINZELNEN BEREICHE
   * ======================================================================*/
  const inhalt = (b) => ({
    konto: () =>
      kopf('Mein Konto', 'Diese App kennt kein Konto und keinen Server. Dein Name steht nur hier ' +
           'im Browser und erscheint bei Kommentaren und Erwähnungen.') +
      zeile('Name', 'So wirst du in Kommentaren genannt', feld('nutzer', V('nutzer', ''), 'Dein Name')) +
      zeile('Symbol', 'Kürzel oben in der Seitenleiste', feld('arbeitsIcon', V('arbeitsIcon', 'N'))) +
      zeile('E-Mail', 'Wird nicht gebraucht — es gibt keine Anmeldung',
            '<span class="ez-grau">keine nötig</span>') +
      zeile('Passwort', 'Einzelne Seiten lassen sich verschlüsseln',
            knopf('seite-sperren', 'Seite verschlüsseln')) +
      zeile('Angemeldete Geräte', 'Nichts wird übertragen, es gibt keine Sitzungen',
            '<span class="ez-grau">nur dieses Gerät</span>') +
      zeile('Konto löschen', 'Entfernt alle Daten aus diesem Browser',
            knopf('alles-loeschen', 'Alle Daten löschen', 'warn')),

    allgemein: () =>
      kopf('Einstellungen') +
      zeile('Erscheinungsbild', 'Hell, dunkel oder wie das System',
            wahl('theme', [['dark', 'Dunkel'], ['light', 'Hell'], ['system', 'Wie das System']], V('theme', 'dark'))) +
      zeile('Schriftgrösse', 'Gilt für den ganzen Text',
            wahl('schriftgroesse', [['klein', 'Klein'], ['normal', 'Normal'], ['gross', 'Gross']], V('schriftgroesse', 'normal'))) +
      zeile('Zeilenabstand', 'Enger oder luftiger',
            wahl('dichte', [['eng', 'Eng'], ['normal', 'Normal'], ['weit', 'Weit']], V('dichte', 'normal'))) +
      zeile('Beim Öffnen zeigen', 'Was erscheint, wenn du die App startest',
            wahl('startAnsicht', [['letzte', 'Zuletzt geöffnete Seite'], ['start', 'Startseite'],
                                  ['journal', 'Heutiges Journal'], ['posteingang', 'Posteingang']],
                 V('startAnsicht', 'letzte'))) +
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
      zeile('Karteikarten', 'Beim Start melden, wenn Karten fällig sind',
            schalter('kartenMelden', V('kartenMelden', true))) +
      zeile('Offene Erinnerungen', '', `<span class="ez-grau">${Werkzeuge.erinnerungen().filter(e => !e.erledigt).length} offen</span>`) +
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
            `<span class="ez-grau">${z.ics.anzahl} Abos</span> ` + knopf('kalender-verb', 'Öffnen')) +
      zeile('Mail', 'Gmail holen, beschriften, beantworten — oder EML-Dateien einlesen',
            knopf('mail-verb', 'Öffnen')) +
      zeile('GitHub und Jira', 'Issues und Vorgänge als gespiegelte Datenbank',
            `<span class="ez-grau">${z.github.verbunden ? 'GitHub verbunden' : 'nicht verbunden'}` +
            `</span> ` + knopf('spiegel-verb', 'Öffnen')) +
      zeile('MCP-Server', 'Fremde Werkzeuge für die KI',
            `<span class="ez-grau">${(Store.getMeta('mcp:server', []) || []).length} eingetragen</span> ` +
            knopf('mcp-verb', 'Öffnen')) +
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
        (liste.length ? liste.map(b =>
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

    daten: () =>
      kopf('Import und Export') +
      zeile('Sicherung speichern', 'Alles als eine JSON-Datei', knopf('export-json', 'Speichern')) +
      zeile('Sicherung laden', 'Ersetzt den jetzigen Inhalt', knopf('import-json', 'Laden')) +
      zeile('Markdown-Ordner schreiben', 'Je Seite eine .md-Datei, Unterseiten in Unterordnern',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Markdown-Ordner einlesen', 'Legt aus jeder Datei eine Seite an',
            knopf('ordner-lesen', 'Ordner wählen')) +
      zeile('Dateien einlesen', 'Markdown, Text, CSV, TSV, HTML, Excel (.xlsx), Word (.docx), EPUB — ' +
            'Excel wird zur Datenbank, EPUB zu einem Wiki mit Kapiteln',
            knopf('dateien-lesen', 'Dateien wählen')) +
      zeile('Als eine HTML-Datei', 'Zum Weitergeben und Archivieren', knopf('einzeldatei', 'Erzeugen')) +
      zeile('Offene Seite als Markdown', '', knopf('seite-md', 'Speichern')) +
      zeile('Offene Seite als HTML', '', knopf('seite-html', 'Speichern')) +
      zeile('Offene Seite drucken oder als PDF', '', knopf('seite-pdf', 'Drucken')) +
      zeile('Automatische Sicherung', 'Beim Schliessen an eine Sicherung erinnern',
            schalter('sicherungErinnern', V('sicherungErinnern', false))),

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
      const zeilen = KI.ANBIETER.map(a => {
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
      zeile('Alte Versionen aufräumen', 'Behält je Seite die letzten fünf Fassungen',
            knopf('versionen-aufraeumen', 'Aufräumen')) +
      zeile('Speicher dauerhaft anfordern', 'Der Browser räumt die Daten dann nicht von selbst weg',
            knopf('speicher-sichern', 'Anfordern')),

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
        ? liste.map((w, i) =>
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
      const alle = Object.values(Store.cache.blocks)
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
      const bloecke = Object.values(Store.cache.blocks).filter(b2 => b2.alive !== false);
      const seiten = bloecke.filter(b2 => b2.type === 'page' && !b2.system);
      const dbs = Object.values(Store.cache.collections);
      const zeilen2 = dbs.reduce((n, c) => n + Store.rowsOf(c.id).length, 0);
      const woerter = bloecke.reduce((n, b2) =>
        n + ((b2.text || '').trim() ? b2.text.trim().split(/\s+/).length : 0), 0);
      const aufrufe = seiten.reduce((n, p2) => n + (p2.aufrufe || 0), 0);
      const meist = [...seiten].sort((a, b2) => (b2.aufrufe || 0) - (a.aufrufe || 0)).slice(0, 8);
      const tage = {};
      seiten.forEach(p2 => {
        const t = String(p2.created || '').slice(0, 10);
        if (t) tage[t] = (tage[t] || 0) + 1;
      });
      const letzte = Object.entries(tage).sort().slice(-7);
      const hoch = Math.max(1, ...letzte.map(x => x[1]));

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
        ? '<div class="emoji-eigene">' + eigene.map((e, i) =>
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
      zeile('Speicherort der Daten', '', '<span class="ez-grau">IndexedDB „notizen"</span>')
  }[b] || (() => kopf('Unbekannt')))();

  /* ========================================================================
   * BEDIENUNG
   * ======================================================================*/
  const binde = (o) => {
    /* Auswahlfelder und Textfelder */
    o.querySelectorAll('[data-set]').forEach(el => {
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
    o.querySelectorAll('[data-toggle]').forEach(b => {
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

        const neu = !V(k, k === 'erinnernInApp' || k === 'kartenMelden' ||
                          k === 'kiKontext' || k === 'autoVersionen' || k === 'ki:webFragen');
        S(k, neu);
        b.classList.toggle('an', neu);
        if (k === 'rechtschreib') App.zeichneSeite();
      });
    });

    /* Bereiche löschen */
    o.querySelectorAll('[data-bereich-weg]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.bereichWeg;
        S('bereiche', (V('bereiche', []) || []).filter(x => x.id !== id));
        Links.seiten().filter(p => p.bereich === id).forEach(p => Store.updateBlock(p.id, { bereich: '' }));
        App.zeichneBaum();
        o.neuZeichnen();
      });
    });

    /* Knöpfe */
    o.querySelectorAll('[data-tun]').forEach(b =>
      b.addEventListener('click', () => tun(b.dataset.tun, o)));

    /* Speicherplatz nachreichen */
    const zahlen = o.querySelector('#speicher-zahlen');
    if (zahlen) Store.usage().then(u => {
      zahlen.textContent = u
        ? `${(u.benutzt / 1048576).toFixed(1)} MB benutzt von etwa ` +
          `${(u.verfuegbar / 1073741824).toFixed(1)} GB, die der Browser erlaubt`
        : 'Der Browser sagt nicht, wie viel Platz belegt ist.';
    });
  };

  const kopfzeileAuffrischen = () => {
    const btn = document.querySelector('#btn-settings');
    if (!btn) return;
    btn.querySelector('.ws-icon').textContent = V('arbeitsIcon', 'N');
    btn.querySelectorAll('span')[1].textContent = V('arbeitsName', 'Redion');
  };

  const tun = async (was, o) => {
    const seite = App.aktuelleSeite() ? Store.getBlock(App.aktuelleSeite()) : null;

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
      } catch (err) { UI.banner('Vektoren: ' + err.message, 'warn'); }
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
      Werkzeuge.alsHtmlDatei ? Werkzeuge.alsHtmlDatei(seite) : Werkzeuge.teilenMenue(document.body, seite);
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
      const liste = Agent.worker().filter((_, i) => i !== +was.slice(11));
      Store.setMeta('agent:worker', liste);
      o.neuZeichnen && o.neuZeichnen();
      return;
    }
    if (was.startsWith('worker-lauf:')) {
      const w = Agent.worker()[+was.slice(12)];
      if (!w) return;
      const daten = Object.values(Store.cache.collections)
        .flatMap(c => Store.rowsOf(c.id).map(r => ({ titel: r.text, ...(r.props || {}) })));
      try {
        const raus = await Agent.workerLaufen(w, daten);
        UI.toast('Ergebnis: ' + JSON.stringify(raus).slice(0, 120));
      } catch (e) { UI.toast('Der Worker ist gescheitert: ' + e.message); }
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
      Object.values(Store.cache.blocks)
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
      const seiten = Object.values(Store.cache.blocks)
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
        const f = inp.files[0];
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
              g.drawImage(img, 0, 0, 64, 64);
              ok2(c.toDataURL('image/png'));
            };
            img.onerror = () => ok2(fr.result);
            img.src = fr.result;
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
        const alt4 = { quelle: KI.zustand.quelle, anbieter: KI.zustand.anbieter, modell: KI.zustand.modell };
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
        UI.banner(KI.anbieter(id).name + ' meldet: ' + err.message, 'fehler');
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
      'ollama-suchen': async () => { UI.toast('Suche nach Ollama …'); await KI.start(); o.neuZeichnen(); },
      'ki-modell': () => { o.remove(); App.kiPanel(true); setTimeout(() => KI.modellMenue(), 200); },
      'ordner-schreiben': () => Werkzeuge.ordnerSchreiben(),
      'ordner-lesen': () => { o.remove(); Werkzeuge.ordnerLesen(); },
      'dateien-lesen': () => { o.remove(); Werkzeuge.dateienLesen(); },
      'einzeldatei': () => Werkzeuge.einzelDatei(),
      'export-json': () => App.sicherungSpeichern(),
      'import-json': () => App.sicherungLaden(() => o.remove()),
      'seite-md': () => seite && App.markdownExport(seite),
      'seite-html': () => seite && Werkzeuge.htmlExport(seite),
      'seite-pdf': () => { o.remove(); if (seite) Werkzeuge.drucken(seite); },
      'seite-sperren': () => { o.remove(); if (seite) Werkzeuge.sperren(seite); },
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
        Blocks.seitenPicker('Welche Seite soll die Startseite sein?', (id) => {
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
        Blocks.seitenPicker('Welche Seite soll zugeordnet werden?', (id) => {
          const m = UI.menu('<div class="grp">In welchen Bereich?</div>' +
            liste.map(b => `<button data-b="${b.id}"><span class="mi">${esc(b.icon)}</span>${esc(b.name)}</button>`).join('') +
            '<hr><button data-b="">Keinem Bereich</button>', innerWidth / 2 - 120, 160);
          m.addEventListener('click', e => {
            const b = e.target.closest('button[data-b]');
            if (!b) return;
            Store.updateBlock(id, { bereich: b.dataset.b });
            m.remove(); App.zeichneBaum();
            UI.toast('Zugeordnet');
          });
        });
      },
      'versionen-aufraeumen': async () => {
        let weg = 0;
        for (const p of Links.seiten()) {
          const v = await Store.versionen(p.id);
          for (const alt of v.slice(5)) { await Store.versionLoeschen(alt.id); weg++; }
        }
        UI.toast(weg + ' alte Fassungen entfernt');
      },
      'speicher-sichern': async () => {
        if (!navigator.storage?.persist) { UI.toast('Der Browser kann das nicht'); return; }
        const ok = await navigator.storage.persist();
        UI.toast(ok ? 'Der Speicher ist jetzt dauerhaft' : 'Der Browser hat abgelehnt');
      },
      'alles-loeschen': async () => {
        if (!confirm('Wirklich ALLE Seiten und Datenbanken löschen?')) return;
        if (!confirm('Ganz sicher? Am besten vorher eine Sicherung speichern.')) return;
        await Store.wipe();
        location.reload();
      }
    };
    if (karte[was]) await karte[was]();
  };

  /* ========================================================================
   * WAS BEIM START GILT
   * ======================================================================*/
  const start = () => {
    anwenden();
    if (V('seiteZu', false)) document.getElementById('sidebar').classList.add('collapsed');

    /* Fällige Karteikarten melden */
    if (V('kartenMelden', true)) {
      const n = Werkzeuge.faellig().length;
      if (n) setTimeout(() => UI.toast('🎴 ' + n + ' Karteikarten sind fällig'), 1800);
    }
  };

  return { oeffne, start, anwenden, datum, wochenstart, V, S, GRUPPEN, BEREICHE };
})();

window.Einstellungen = Einstellungen;
