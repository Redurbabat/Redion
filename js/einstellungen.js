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

  const BEREICHE = [
    ['konto',        '👤', 'Mein Konto'],
    ['allgemein',    '⚙️', 'Einstellungen'],
    ['benachricht',  '🔔', 'Benachrichtigungen'],
    ['verbindungen', '🔌', 'Verbindungen'],
    ['arbeitsplatz', '🏠', 'Arbeitsbereich'],
    ['bereiche',     '👥', 'Bereiche'],
    ['sicherheit',   '🛡', 'Sicherheit'],
    ['daten',        '💾', 'Import und Export'],
    ['ki',           '✨', 'Künstliche Intelligenz'],
    ['speicher',     '📦', 'Speicher'],
    ['abrechnung',   '💳', 'Abrechnung'],
    ['ueber',        'ℹ️', 'Über diese App']
  ];

  /* ========================================================================
   * ANWENDEN — Einstellungen wirken sofort
   * ======================================================================*/
  const anwenden = () => {
    document.documentElement.dataset.theme = V('theme', 'dark');
    document.body.dataset.schrift = V('schriftgroesse', 'normal');
    document.body.dataset.dichte  = V('dichte', 'normal');
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
          `<div><b>${esc(V('arbeitsName', 'Notizen'))}</b>` +
          `<span>${esc(V('nutzer', 'Ohne Namen'))}</span></div></div>` +
          BEREICHE.map(([id, i, n]) =>
            `<button data-b="${id}" class="${id === offenerBereich ? 'on' : ''}">` +
            `<span class="mi">${i}</span>${n}</button>`).join('') +
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

    verbindungen: () =>
      kopf('Verbindungen', 'Diese App verbindet sich mit nichts im Netz — ausser mit dem, ' +
           'was auf deinem eigenen Rechner läuft.') +
      zeile('Ollama', 'Lokale KI auf diesem Rechner',
            `<span class="ez-grau">${KI.zustand.quelle === 'ollama' ? 'verbunden' : 'nicht gefunden'}</span> ` +
            knopf('ollama-suchen', 'Erneut suchen')) +
      zeile('WebLLM', 'KI direkt im Browser',
            `<span class="ez-grau">${'gpu' in navigator ? 'möglich' : 'kein WebGPU'}</span>`) +
      zeile('Ordner auf der Festplatte', 'Notizen als Markdown-Dateien ablegen',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Kalender, Mail, Slack, Drive', 'Bräuchten ein Konto und einen Server',
            '<span class="ez-grau">nicht vorgesehen</span>') +
      zeile('Was hinausgeht', '',
            '<span class="ez-grau">nichts — kein Netzverkehr ausser dem WebLLM-Modell beim ersten Laden</span>'),

    arbeitsplatz: () =>
      kopf('Arbeitsbereich') +
      zeile('Name', 'Steht oben in der Seitenleiste', feld('arbeitsName', V('arbeitsName', 'Notizen'))) +
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
      zeile('Fremdes Teilen', 'Ohne Server nicht möglich — und damit auch kein Leck',
            '<span class="ez-grau">nicht vorhanden</span>') +
      zeile('Datenschutz', '',
            '<span class="ez-grau">kein Konto, keine Anmeldung, keine Übertragung</span>'),

    daten: () =>
      kopf('Import und Export') +
      zeile('Sicherung speichern', 'Alles als eine JSON-Datei', knopf('export-json', 'Speichern')) +
      zeile('Sicherung laden', 'Ersetzt den jetzigen Inhalt', knopf('import-json', 'Laden')) +
      zeile('Markdown-Ordner schreiben', 'Je Seite eine .md-Datei, Unterseiten in Unterordnern',
            knopf('ordner-schreiben', 'Ordner wählen')) +
      zeile('Markdown-Ordner einlesen', 'Legt aus jeder Datei eine Seite an',
            knopf('ordner-lesen', 'Ordner wählen')) +
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
            '<span class="ez-grau">verfügbar</span>'),

    speicher: () =>
      kopf('Speicher', 'Alles liegt in IndexedDB in diesem Browserprofil.') +
      '<div id="speicher-zahlen" class="ez-grau" style="padding:4px 0 14px">wird gemessen …</div>' +
      zeile('Blöcke', '', `<span class="ez-grau">${Object.keys(Store.cache.blocks).length}</span>`) +
      zeile('Datenbanken', '', `<span class="ez-grau">${Object.keys(Store.cache.collections).length}</span>`) +
      zeile('Ansichten', '', `<span class="ez-grau">${Object.keys(Store.cache.views).length}</span>`) +
      zeile('Papierkorb', '', `<span class="ez-grau">${Store.trashed().length} Seiten</span> ` +
            knopf('papierkorb', 'Öffnen')) +
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
      zeile('Ansichten', '', '<span class="ez-grau">8</span>') +
      zeile('Formelfunktionen', '', '<span class="ez-grau">über 90</span>') +
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
        const neu = !V(k, k === 'erinnernInApp' || k === 'kartenMelden' || k === 'kiKontext' || k === 'autoVersionen');
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
    btn.querySelectorAll('span')[1].textContent = V('arbeitsName', 'Notizen');
  };

  const tun = async (was, o) => {
    const seite = App.aktuelleSeite() ? Store.getBlock(App.aktuelleSeite()) : null;

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

  return { oeffne, start, anwenden, datum, wochenstart, V, S };
})();

window.Einstellungen = Einstellungen;
