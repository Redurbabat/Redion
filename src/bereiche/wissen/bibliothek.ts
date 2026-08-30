/* ============================================================================
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/bibliothek.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/bibliothek.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ==========================================================================*/
/* ==========================================================================
 * bibliothek.js — Bibliothek, Meine Aufgaben, Marktplatz
 *
 * Notion hat unten in der Seitenleiste einen eigenen Abschnitt: Bibliothek,
 * Meine Aufgaben, Marktplatz, Hilfe, Papierkorb. Die ersten beiden sind
 * vollwertige Seiten — keine Fenster. Genau so ist es hier gebaut.
 *
 * Bibliothek      alle Seiten in einer Tabelle, mit Reitern und Sortierung
 * Meine Aufgaben  alles, was dem angemeldeten Konto zugewiesen ist,
 *                 quer über alle Datenbanken hinweg
 * ========================================================================*/
const Bibliothek = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  const rightsActive = (): boolean =>
    typeof Konten !== 'undefined' && typeof Konten.darf === 'function';

  const permitted = (action: 'lesen' | 'bearbeiten', pageId?: string): boolean =>
    !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));

  /** Die kanonische Datenbankseite, nicht eine verknüpfte Zweitansicht. */
  const collectionPageId = (collectionId: string): string => {
    const blocks = Object.values<any>(Store.cache.blocks)
      .filter(block => block?.alive !== false && block.type === 'database' &&
        block.collectionId === collectionId);
    const block = blocks.find(item => !item.verknuepft) || blocks[0];
    if (!block || typeof Links === 'undefined' || !Links.seiteVon) return '';
    return String(Links.seiteVon(block.id)?.id || '');
  };

  const collectionPermitted = (action: 'lesen' | 'bearbeiten', collectionId: string): boolean => {
    if (!rightsActive()) return true;
    const pageId = collectionPageId(collectionId);
    return !!pageId && permitted(action, pageId);
  };

  /* ------------------------------------------------------------------ *
   * Hilfen
   * ------------------------------------------------------------------ */

  /** Alle echten Seiten — ohne Systemseiten, ohne Papierkorb. */
  const alleSeiten = (): any[] => Object.values<any>(Store.cache.blocks)
    .filter(b => b.type === 'page' && b.alive !== false && !b.system &&
      (b.parentTable === 'collection'
        ? collectionPermitted('lesen', b.parentId)
        : permitted('lesen', b.id)));

  /** Woher kommt die Seite: aus einer Datenbank, aus einem Bereich, privat? */
  const quelleVon = (p: any): any => {
    if (p.parentTable === 'collection') {
      const c = Store.cache.collections[p.parentId];
      return { icon: '▦', text: c ? c.name : 'Datenbank', id: c ? c.id : '' };
    }
    if (p.bereich) {
      const b = (Store.getMeta('bereiche', []) || []).find((x: any) => x.id === p.bereich);
      if (b) return { icon: b.icon || '👥', text: b.name, id: '' };
    }
    const pfad = Store.pathOf(p.id);
    if (pfad.length > 1) {
      const sichtbar = pfad.slice(0, -1).find((item: any) => permitted('lesen', item.id));
      if (sichtbar)
        return { icon: sichtbar.icon || '📄', text: sichtbar.text || 'Ohne Titel', id: sichtbar.id };
      return { icon: '👥', text: 'Direkt freigegeben', id: '' };
    }
    return { icon: '🔒', text: 'Privat', id: '' };
  };

  /** Zeitstempel als Zahl — egal ob ISO-Text oder Millisekunden. */
  const zeitZahl = (wann: unknown): number => {
    if (!wann) return 0;
    const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
    return isNaN(ms) ? 0 : ms;
  };

  const wannText = (wann: unknown): string => {
    if (!wann) return '—';
    /* Zeitstempel liegen als ISO-Text vor, nicht als Zahl. */
    const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
    if (isNaN(ms)) return '—';
    const d = Math.floor((Date.now() - ms) / 60000);
    if (d < 1)    return 'gerade eben';
    if (d < 60)   return 'vor ' + d + 'm';
    if (d < 1440) return 'vor ' + Math.floor(d / 60) + 'h';
    if (d < 10080) return 'vor ' + Math.floor(d / 1440) + ' Tagen';
    return new Date(ms).toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ------------------------------------------------------------------ *
   * BIBLIOTHEK
   * ------------------------------------------------------------------ */

  const REITER = [
    { id: 'kuerzlich', icon: '🕘', name: 'Kürzlich verwendet' },
    { id: 'favoriten', icon: '☆',  name: 'Favoriten' },
    { id: 'geteilt',   icon: '👥', name: 'Geteilt' },
    { id: 'privat',    icon: '🔒', name: 'Privat' },
    { id: 'schule',    icon: '🎓', name: 'Ausbildung' },
    { id: 'datenbank', icon: '▦',  name: 'In Datenbanken' },
    { id: 'alle',      icon: '▤',  name: 'Alle' }
  ];

  const SPALTEN = [
    { id: 'name',   icon: '📄', name: 'Seitenbezeichnung', breit: '2fr' },
    { id: 'von',    icon: '👤', name: 'Erstellt von',      breit: '1fr' },
    { id: 'quelle', icon: '📍', name: 'Quelle',            breit: '1.2fr' },
    { id: 'wann',   icon: '🕘', name: 'Zuletzt bearbeitet', breit: '1fr' }
  ];

  /* REGAL ODER LISTE (E207).
     Die Bibliothek war eine Tabelle: dreizehn Zeilen, in jeder ein Titel und
     dreimal dieselbe Auskunft („Ich", „gerade eben"). Man liest darin nicht,
     man sucht — und man muss den Titel schon kennen, um ihn zu finden.

     Der abgenommene Entwurf zeigt stattdessen ein Regal: je Heft eine Karte,
     und auf jeder Karte steht der ANFANG der Seite, an der zuletzt gearbeitet
     wurde. Das ist dieselbe Antwort wie in „Weiter wo du warst" (E205), nur
     für den ganzen Bestand.

     Die Tabelle bleibt vollständig erhalten und ist einen Klick entfernt.
     Sie kann etwas, das das Regal nicht kann — nach Spalten sortieren,
     Eigenschaften ein- und ausblenden, viele Zeilen auf einmal überblicken.
     Was gebraucht wird, entscheidet nicht die Form, sondern die Frage. */
  /**
   * Welche Form ist gewählt?
   *
   * DIESER WERT WIRD BEIM ZEICHNEN GELESEN UND NICHT BEIM LADEN. Der erste
   * Entwurf legte ihn als `zustand.form = formLesen()` an — und diese Zeile
   * läuft, während die Datei geladen wird, also lange bevor IndexedDB
   * ausgelesen ist. `getMeta` gab damals brav den Standard zurück, und die
   * gemerkte Wahl war beim nächsten Start weg: wer „Liste" wählte, bekam
   * wieder das Regal.
   *
   * Gefunden hat es das Bild — ich hatte im Bildskript ausdrücklich „liste"
   * gesetzt und bekam ein Regal. Kein Wurf, keine Meldung; dieselbe Sorte
   * stiller Fehler wie `Store` an `window` (E207, `vorschau.ts`).
   */
  const form = (): 'deckel' | 'regal' | 'liste' => {
    const wahl = Store.getMeta('bibForm', 'deckel');
    return wahl === 'liste' ? 'liste' : wahl === 'regal' ? 'regal' : 'deckel';
  };

  let zustand = { reiter: 'kuerzlich', sortier: 'wann', richtung: 'ab',
                  suche: '', sucheOffen: false, spalten: SPALTEN.map(s => s.id),
                  /* Der Artfilter der Deckelansicht (E236). Er steht NEBEN
                     `reiter`, nicht darin: der Reiter fragt „wo liegt es",
                     die Art fragt „was ist es". Zwei Fragen, zwei Filter. */
                  art: 'alle' };

  /** Eine zusammengefuehrte Sicht auf bestehende Redion-Daten. Sie speichert
      weder Dashboard-Karten noch PDF-Kopien; alle Listen sind begrenzt. */
  const zeichneSchule = (wrap: HTMLElement): void => {
    const blocks = Object.values<any>(Store.cache.blocks);
    const root = blocks.find(block => block?.alive !== false && block.type === 'page' &&
      (block.schoolRoot === true || block.systemRole === 'school-root') && permitted('lesen', block.id));
    if (!root) {
      wrap.innerHTML = '<div class="school-home school-empty"><div class="school-empty-icon">🎓</div>' +
        '<h1>Ausbildungsbereich</h1><p>Lege die additive Ausbildungsvorlage an. Sie erstellt normale Seiten und Datenbanken.</p>' +
        '<button data-school-action="install" class="prim">Ausbildung einrichten</button></div>';
      wrap.querySelector('[data-school-action="install"]')?.addEventListener('click', () => {
        if (!permitted('bearbeiten')) {
          UI.toast('Du darfst hier keinen Ausbildungsbereich anlegen.');
          return;
        }
        const page = Galerie.bauen('ausbildung'); if (page) { App.zeichneBaum(); App.oeffne(page.id); }
      });
      return;
    }

    const children = Store.childrenOf(root.id)
      .filter((block: any) => block.alive !== false && block.type === 'page' &&
        block.parentTable !== 'collection' && permitted('lesen', block.id))
      .slice(0, 18);
    const documentPages = new Map<string, any>();
    blocks.filter(block => block?.alive !== false && block.type === 'pdfseite')
      .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
      .forEach(block => {
        if (documentPages.size >= 6) return;
        const page = Links.seiteVon(block.id);
        if (page && permitted('lesen', page.id) && !documentPages.has(page.id))
          documentPages.set(page.id, { page, block });
      });
    const due = typeof Learning !== 'undefined' && Learning.dailyQueue
      ? Learning.dailyQueue().all.slice(0, 6)
      : (Werkzeuge.faellig ? Werkzeuge.faellig().slice(0, 6) : []);
    const tasks = meineAufgaben().filter(task => !task.fertig).slice(0, 6);
    const examCollections = Object.values<any>(Store.cache.collections)
      .filter(collection => collection.schoolRootId === root.id && collection.schoolKind === 'exams' &&
        collectionPermitted('lesen', collection.id));
    const exams: any[] = [];
    const now = Date.now(), horizon = now + 120 * 86400000;
    examCollections.forEach(collection => {
      const dateKey = Object.keys(collection.schema || {}).find(key => collection.schema[key].type === 'date');
      if (!dateKey) return;
      Store.rowsOf(collection.id).forEach((row: any) => {
        const date = Date.parse(String(row.props?.[dateKey] || ''));
        if (Number.isFinite(date) && date >= now - 86400000 && date <= horizon)
          exams.push({ row, date, collection });
      });
    });
    exams.sort((a, b) => a.date - b.date);

    const list = (items: any[], make: (item: any) => string, empty: string): string =>
      items.length ? items.map(make).join('') : '<p class="school-none">' + esc(empty) + '</p>';
    wrap.innerHTML =
      '<div class="school-home">' +
        '<div class="school-hero"><div><span>🎓 Ausbildung</span><h1>' + esc(root.text || 'Ausbildung') +
          '</h1><p>Seiten, Lernstoff und Termine an einem Ort – alles bleibt normale Redion-Struktur.</p></div>' +
          '<div class="school-quick"><button data-school-action="capture">📷 Erfassen</button>' +
          '<button data-school-action="learn">🎴 Lernen</button>' +
          '<button data-school-action="calculate">⚡ Rechnen</button>' +
          '<button data-school-open="' + esc(root.id) + '">↗ Seite öffnen</button></div></div>' +
        '<section class="school-section"><h2>Ordner & Bereiche</h2><div class="school-folders">' +
          list(children, page => '<button class="school-folder" data-school-open="' + esc(page.id) + '">' +
            '<span>' + esc(page.icon || '📁') + '</span><b>' + esc(page.text || 'Ohne Titel') + '</b>' +
            '<em>' + Store.childrenOf(page.id).filter((child: any) => child.type !== 'page' ||
              permitted('lesen', child.id)).length + ' Einträge</em></button>',
            'Noch keine Unterseiten.') + '</div></section>' +
        '<div class="school-grid">' +
          '<section class="school-card"><h2>Zuletzt verwendete PDFs</h2>' +
            list([...documentPages.values()], item => '<button data-school-doc="' + esc(item.page.id) + '">' +
              '<span>📄</span><b>' + esc(item.page.text || 'PDF-Seite') + '</b><em>Seite ' +
              esc(item.block.nr || 1) + '</em></button>', 'Noch kein PDF abgelegt.') + '</section>' +
          '<section class="school-card"><h2>Heute lernen</h2>' +
            list(due, item => {
              const card = item.card || item;
              return '<button data-school-block="' + esc(card.id) + '"><span>🎴</span><b>' +
                esc((String(card.text || 'Karte').split('::')[0] || 'Karte').replace(/\{\{|\}\}/g, '')) +
                '</b><em>' + esc(item.reason || 'fällig') + '</em></button>';
            }, 'Keine Karten fällig.') + '</section>' +
          '<section class="school-card"><h2>Offene Aufgaben</h2>' +
            list(tasks, task => '<button data-school-open="' + esc(task.id) + '"><span>☐</span><b>' +
              esc(task.titel) + '</b><em>' + esc(task.datum ? String(task.datum).slice(0,10) : task.coll.name) +
              '</em></button>', 'Keine offene Aufgabe gefunden.') + '</section>' +
          '<section class="school-card"><h2>Nächste Prüfungen</h2>' +
            list(exams.slice(0, 6), exam => '<button data-school-open="' + esc(exam.row.id) + '"><span>📅</span><b>' +
              esc(exam.row.text || exam.row.props?.title || 'Prüfung') + '</b><em>' +
              esc(new Date(exam.date).toLocaleDateString('de-CH')) + '</em></button>',
              'Noch kein Prüfungstermin eingetragen.') + '</section>' +
        '</div>' +
      '</div>';

    wrap.querySelectorAll<HTMLElement>('[data-school-open]').forEach(button =>
      button.addEventListener('click', () => button.dataset.schoolOpen && App.oeffne(button.dataset.schoolOpen)));
    wrap.querySelectorAll<HTMLElement>('[data-school-block]').forEach(button =>
      button.addEventListener('click', () => button.dataset.schoolBlock && App.zeigeBlock(button.dataset.schoolBlock)));
    wrap.querySelectorAll<HTMLElement>('[data-school-doc]').forEach(button => button.addEventListener('click', () => {
      const page = button.dataset.schoolDoc ? Store.getBlock(button.dataset.schoolDoc) : null;
      if (!page || !permitted('lesen', page.id)) return;
      if (permitted('bearbeiten', page.id)) Store.updateBlock(page.id, { dokumentModus: true });
      App.oeffne(page.id);
    }));
    wrap.querySelector('[data-school-action="capture"]')?.addEventListener('click', () => {
      if (!permitted('bearbeiten', root.id)) {
        UI.toast('Du darfst im Ausbildungsbereich nichts erfassen.');
        return;
      }
      Recognition.scan();
    });
    wrap.querySelector('[data-school-action="learn"]')?.addEventListener('click', () => Werkzeuge.lernen());
    wrap.querySelector('[data-school-action="calculate"]')?.addEventListener('click', () => Electrical.open(root));
  };

  const gefiltert = (): any[] => {
    const alle = alleSeiten();
    const freigaben = (p: any): boolean => {
      if (typeof Konten === 'undefined' || !Konten.freigabenVon) return false;
      const entries = Konten.freigabenVon(p.id) || {};
      return Array.isArray(entries) ? entries.length > 0 : Object.keys(entries).length > 0;
    };
    let liste = alle;

    if (zustand.reiter === 'kuerzlich')
      liste = alle.filter(p => p.zuletztGeoeffnet || p.edited)
                  .sort((a, b) => zeitZahl(b.zuletztGeoeffnet || b.edited) -
                                  zeitZahl(a.zuletztGeoeffnet || a.edited))
                  .slice(0, 60);
    if (zustand.reiter === 'favoriten') liste = alle.filter(p => p.favorite);
    if (zustand.reiter === 'geteilt')   liste = alle.filter(p => freigaben(p) || p.oeffentlich);
    if (zustand.reiter === 'privat')    liste = alle.filter(p => p.parentTable !== 'collection' && !p.bereich);
    if (zustand.reiter === 'datenbank') liste = alle.filter(p => p.parentTable === 'collection');

    if (zustand.suche) {
      const s = zustand.suche.toLowerCase();
      liste = liste.filter(p => (p.text || '').toLowerCase().includes(s));
    }

    if (zustand.reiter !== 'kuerzlich' || zustand.sortier !== 'wann') {
      const wert = (p: any): string | number => zustand.sortier === 'name'   ? (p.text || '').toLowerCase()
                        : zustand.sortier === 'von'    ? (p.erstelltVon || '').toLowerCase()
                        : zustand.sortier === 'quelle' ? quelleVon(p).text.toLowerCase()
                        : zeitZahl(p.edited || p.created);
      liste = [...liste].sort((a, b) => {
        const x = wert(a), y = wert(b);
        const v = x < y ? -1 : x > y ? 1 : 0;
        return zustand.richtung === 'auf' ? v : -v;
      });
    }
    return liste;
  };

  /* ====================================================================== *
   * DAS REGAL (E207)
   * ---------------------------------------------------------------------- *
   * Ein „Heft" ist keine neue Datenart und wird auch keine. Es ist die
   * QUELLE, die `quelleVon()` ohnehin schon für jede Seite ausrechnet: die
   * Datenbank, in der sie liegt, die Elternseite, der Lebensbereich, oder
   * „Privat". Der Entwurf nennt das Heft; der Bestand nennt es Quelle. Es
   * ist dasselbe, und deshalb braucht es dafür keine Migration, keinen
   * zweiten Speicher und keinen Umzug (§9).
   * ====================================================================== */

  /* ====================================================================== *
   * DIE DECKEL — DAS REGAL JE DOKUMENT (E236)
   * ---------------------------------------------------------------------- *
   * Redur hat ein Bild geschickt: ein Regal aus Deckeln, jeder sagt schon
   * von weitem, WAS er ist — ein PDF, ein Notizbuch, ein Whiteboard, eine
   * Tabelle. Die Bibliothek hatte bisher zwei Formen, und keine davon:
   *
   *     Tabelle   dreizehn Zeilen, in jeder dreimal dieselbe Auskunft
   *     Regal     je QUELLE eine Karte — also je Heft, nicht je Dokument
   *
   * Die Deckelform ist die dritte, nicht ein Ersatz. Beide alten bleiben,
   * weil beide etwas können, was diese nicht kann: die Tabelle sortiert
   * nach Spalten, das Heftregal zeigt Zusammengehöriges.
   *
   * KEINE NEUE DATENART, KEIN NEUES FELD. Die Art eines Dokuments wird
   * ABGELESEN aus dem, was darin liegt — genau wie das Heft aus
   * `quelleVon()` abgelesen wird. Ein Feld `art` am Block wäre eine
   * Migration, und eine Migration für eine ANSICHT ist der teuerste Weg,
   * den es gibt (§9).
   * ====================================================================== */

  /** Die Arten, die ein Dokument haben kann — Reihenfolge = Vorrang. */
  const ARTEN = [
    { id: 'pdf',    name: 'PDF',        typen: ['pdfseite'] },
    { id: 'board',  name: 'Whiteboard', typen: ['whiteboard'] },
    { id: 'plan',   name: 'Schaltplan', typen: ['schaltplan'] },
    { id: 'blatt',  name: 'Blatt',      typen: ['blatt'] },
    { id: 'tab',    name: 'Tabelle',    typen: ['spreadsheet'] },
    { id: 'db',     name: 'Datenbank',  typen: ['database'] },
    { id: 'karten', name: 'Karteikarten', typen: ['flashcard'] },
    { id: 'datei',  name: 'Dateien',    typen: ['file', 'image', 'video', 'audio'] }
  ] as const;

  type ArtId = typeof ARTEN[number]['id'] | 'ordner' | 'seite';

  /** Was steckt in dieser Seite? Zählt die Kindblöcke, nimmt den Vorrang. */
  const artVon = (p: any): { id: ArtId; name: string } => {
    const kinder = Store.childrenOf(p.id) || [];
    for (const art of ARTEN)
      if (kinder.some((b: any) => b && b.alive !== false &&
                                  (art.typen as readonly string[]).includes(b.type)))
        return { id: art.id, name: art.name };
    /* Eine Seite, die vor allem andere Seiten hält, ist ein Ordner. Das ist
       keine neue Datenart, sondern eine Beschreibung: `page` in `page`. */
    const unterseiten = kinder.filter((b: any) => b && b.alive !== false && b.type === 'page');
    if (unterseiten.length >= 2 && unterseiten.length >= kinder.length - 1)
      return { id: 'ordner', name: unterseiten.length + ' Sachen' };
    return { id: 'seite', name: 'Seite' };
  };

  /** Die Filterzeile über dem Regal — sie filtert nach ART, nicht nach Ort. */
  const ART_FILTER: { id: string; name: string }[] = [
    { id: 'alle',   name: 'Alle' },
    { id: 'pdf',    name: 'PDF' },
    { id: 'board',  name: 'Whiteboards' },
    { id: 'blatt',  name: 'Blätter' },
    { id: 'tab',    name: 'Tabellen' },
    { id: 'db',     name: 'Datenbanken' },
    { id: 'karten', name: 'Karteikarten' },
    { id: 'ordner', name: 'Ordner' }
  ];

  /**
   * Ein Deckel. Was darauf steht, ist keine Zeichnung, sondern eine
   * Aussage: welche Art, und wenn es eine gibt, die echte Vorschau der
   * Seite. `Vorschau.miniatur` liefert sie — dieselbe, die „Weiter wo du
   * warst" verwendet (E205), damit nicht zwei Vorschauen gepflegt werden.
   */
  /* WELCHE ARTEN EINE ECHTE TEXTVORSCHAU VERTRAGEN — und welche nicht.
     Gemessen am Bild: der Deckel eines PDF zeigte „Seite 1Seite 2Seite 3",
     der eines Whiteboards eine graue Pille mit dem Wort „Whiteboard". Das
     ist keine Vorschau, das ist der Name der Blockart dreimal.
     `Vorschau.miniatur` liest den TEXT der Kindblöcke — bei einer Seite ist
     das der Anfang des Textes und damit die beste Auskunft, die es gibt.
     Bei einem PDF, einem Whiteboard oder einer Tabelle steht im Text
     nichts, was jemandem hilft. Dort zeichnet die CSS das Papier. */
  const MIT_TEXT = new Set(['seite', 'karten', 'db']);

  const deckelKarte = (p: any): string => {
    const art = artVon(p);
    const bild = MIT_TEXT.has(art.id) ? (Vorschau.miniatur(p.id, 5) || '') : '';
    const wann = wannText(p.zuletztGeoeffnet || p.edited || p.created);
    return `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="${esc(art.id)}" ` +
      `title="${esc(p.text || 'Ohne Titel')}">` +
      `<span class="bib-deckel-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
        '<i class="bib-papier" aria-hidden="true"></i>' +
        (bild || '') +
        (art.id === 'pdf' ? '<i class="bib-deckel-marke">PDF</i>' : '') +
        `<i class="bib-deckel-stern${p.favorite ? ' an' : ''}" aria-hidden="true">` +
          (p.favorite ? '\u2605' : '\u2606') + '</i>' +
      '</span>' +
      '<span class="bib-deckel-name"><b>' + esc(p.text || 'Ohne Titel') + '</b>' +
        '<i class="bib-deckel-mehr" aria-hidden="true">\u2304</i></span>' +
      '<small>' + esc(art.name) + ' \u00b7 ' + esc(wann) + '</small>' +
      '</button>';
  };

  type Heft = { id: string; icon: string; name: string;
                seiten: any[]; zuletzt: any; wann: number };

  const hefte = (liste: any[]): Heft[] => {
    const nach = new Map<string, Heft>();
    for (const p of liste) {
      const q = quelleVon(p);
      /* Der Schlüssel ist die Kennung, wenn es eine gibt — zwei Datenbanken
         dürfen gleich heissen. Ohne Kennung (Privat, Direkt freigegeben)
         trägt der Name. */
      const schluessel = q.id || ('name:' + q.text);
      let h = nach.get(schluessel);
      if (!h) { h = { id: q.id, icon: q.icon, name: q.text, seiten: [],
                      zuletzt: null, wann: 0 }; nach.set(schluessel, h); }
      h.seiten.push(p);
      const wann = zeitZahl(p.edited || p.created);
      if (wann >= h.wann) { h.wann = wann; h.zuletzt = p; }
    }
    /* DIE NEUESTE SEITE IST NICHT IMMER DIE, DIE MAN ZEIGEN WILL.
       Auf dem Bild vom 26. August stand „Meine Aufgaben" als leerer Kasten
       neben zwei vollen — obwohl das Heft drei Seiten hat. Seine neueste
       Seite („Ollama installieren") ist bloss eine Zeile ohne Inhalt, und
       damit sah das ganze Heft leer aus. Ein Heft mit drei Seiten ist nicht
       leer; nur eine davon ist es.

       Gezeigt wird deshalb die neueste Seite, die überhaupt etwas ZU zeigen
       hat. Hat keine etwas, bleibt es bei der neuesten — dann stimmt „leer"
       auch. */
    for (const h of nach.values()) {
      if (Vorschau.umfang(h.zuletzt?.id || '')) continue;
      const mitInhalt = h.seiten
        .filter(x => Vorschau.umfang(x.id))
        .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))[0];
      if (mitInhalt) h.zuletzt = mitInhalt;
    }
    return [...nach.values()].sort((a, b) => b.wann - a.wann);
  };

  /**
   * WAS EINE DATENBANKZEILE ZU ZEIGEN HAT, STEHT NICHT IN IHREN KINDERN.
   *
   * Auf dem Bild vom 26. August stand „Meine Aufgaben" als leerer Kasten
   * neben zwei vollen — obwohl das Heft drei Seiten hat. Die drei sind
   * Zeilen einer Datenbank; ihr Inhalt steckt in den SPALTEN, nicht in
   * Kindblöcken, und `Vorschau.miniatur` findet dort zu Recht nichts.
   *
   * „Dieses Heft ist noch leer" war damit keine Vorsicht, sondern eine
   * falsche Aussage über einen vollen Bestand — dieselbe Sorte stiller
   * Fehler wie die abgeschnittene Zahl aus §55.2: plausibel und falsch.
   *
   * Was ein solches Heft zu zeigen hat, sind seine Seiten. Das ist keine
   * Notlösung: bei einer Aufgabenliste ist die Liste der Aufgaben genau
   * das, was man sehen will.
   */
  const inhaltsListe = (h: Heft): string => h.seiten.slice()
    .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
    .slice(0, 6)
    .map(x => '<span class="mini-li">' + esc(x.text || 'Ohne Titel') + '</span>')
    .join('');

  /** Ein Blatt aus dem Regal: die Miniatur der zuletzt bearbeiteten Seite. */
  const heftKarte = (h: Heft): string => {
    const seite = h.zuletzt;
    const bild = (seite ? Vorschau.miniatur(seite.id, 6) : '') || inhaltsListe(h);
    return `<button class="bib-heft" data-id="${esc(seite?.id || '')}" ` +
      `title="${esc(h.name)}">` +
      `<span class="bib-heft-marke">${esc(h.icon)} ${esc(h.name)}</span>` +
      `<span class="bib-heft-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
        (bild || '<span>Dieses Heft ist noch leer.</span>') + '</span>' +
      '<span class="bib-heft-fuss"><strong>' +
        esc(seite?.text || h.name) + '</strong><small>' +
        h.seiten.length + (h.seiten.length === 1 ? ' Seite' : ' Seiten') +
        (h.wann ? ' · ' + esc(wannText(h.wann)) : '') +
      '</small></span></button>';
  };

  /** Eine kleine Karte für „Zuletzt in der Hand" — quer über alle Hefte. */
  const handKarte = (p: any): string => {
    const q = quelleVon(p);
    /* Eine Zeile ohne Kindblöcke hat hier nichts zu zeigen — anders als beim
       Heft gibt es auch keine Geschwister, die einspringen könnten. Dann
       steht „noch leer", und das stimmt dann auch. */
    const bild = Vorschau.miniatur(p.id, 4);
    return `<button class="bib-hand" data-id="${esc(p.id)}">` +
      `<span class="bib-hand-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
        (bild || '<span>noch leer</span>') + '</span>' +
      '<span class="bib-hand-fuss"><strong>' + esc(p.text || 'Ohne Titel') +
      '</strong><small>' + esc(q.text) + ' · ' +
      esc(wannText(p.edited || p.created)) + '</small></span></button>';
  };

  /* Der Kopf gehört BEIDEN Formen. Zwei Köpfe wären zwei Orte, an denen
     dieselbe Zahl steht — und einer davon wird irgendwann falsch. */
  /* DIE REITER GEHÖREN IN BEIDE FORMEN, und der erste Entwurf hatte sie nur
     in der Tabelle. `test202` fand es: es sucht `[data-r="mehr"]`, um über
     „Ausbildung" ins Schul-Dashboard zu kommen, und im Regal gab es den
     Knopf nicht. Damit war ein ganzer Bereich von dort aus unerreichbar —
     genau das, was Redurs „nichts löschen" ausschliesst.

     Der Grund für den Fehler ist einfach zu benennen: die Reiter FILTERN den
     Bestand, sie stellen ihn nicht dar. Was gefiltert wird, hat mit der Form
     nichts zu tun. Sie stehen deshalb im gemeinsamen Kopf und nicht in einer
     der beiden Zeichenfunktionen. */
  const bibKopf = (liste: any[], anzahlHefte: number): string =>
    '<h1 class="bib-titel">Bibliothek</h1>' +
    '<p class="bib-zahlen">' + anzahlHefte +
      (anzahlHefte === 1 ? ' Heft' : ' Hefte') + ' · ' + liste.length +
      (liste.length === 1 ? ' Seite' : ' Seiten') + ' auf diesem Gerät</p>' +
    '<div class="bib-kopf">' +
      '<div class="bib-reiter">' +
        REITER.slice(0, 4).map(r =>
          `<button data-r="${r.id}" class="${zustand.reiter === r.id ? 'on' : ''}">` +
          `<span>${r.icon}</span>${esc(r.name)}</button>`).join('') +
        `<button data-r="mehr" class="bib-mehr">${REITER.length - 4} mehr …</button>` +
      '</div>' +
      '<div class="bib-form" role="group" aria-label="Darstellung">' +
        `<button data-form="regal"${form() === 'regal' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>` +
          '<span data-sym="library" aria-hidden="true"></span>Regal</button>' +
        `<button data-form="liste"${form() === 'liste' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"'}>` +
          '<span data-sym="menu" aria-hidden="true"></span>Liste</button>' +
      '</div>' +
    '</div>';

  /* ====================================================================== *
   * SICHERUNG, PAPIERKORB UND PLATZ (E208)
   * ---------------------------------------------------------------------- *
   * Der letzte Teil des abgenommenen Entwurfs. Er ist kein Beiwerk: nach §46
   * ist Priorität 1, keine Daten zu verlieren, und wer auf einen Blick sieht,
   * wann er zuletzt gesichert hat, verliert seltener etwas.
   *
   * ALLE ZAHLEN HIER SIND ECHT. Es gibt keine erfundene Grösse, keinen
   * geschätzten Prozentsatz und keinen Balken ohne Messung — der Entwurf
   * zeigte „41,2 MB von 2 GB", und wenn der Browser diese Zahl nicht
   * herausgibt, steht hier keine. Danach richtet jemand seine Entscheidung
   * aus, ob er noch ein Video einfügt.
   * ====================================================================== */

  const sicherungsKarte = (): string => {
    const st = Sicherung.stand();
    const pk = Sicherung.papierkorb();

    const wieLang = st.tage === null ? 'noch nie'
      : st.tage === 0 ? 'heute'
      : st.tage === 1 ? 'gestern'
      : 'vor ' + st.tage + ' Tagen';
    /* Die Stufe steht NICHT nur in der Farbe (§38): sie steht im Satz. */
    const satz = st.tage === null
      ? 'Noch keine vollständige Sicherung auf diesem Gerät'
      : st.stufe === 'gut' ? 'Gesichert ' + wieLang
      : st.stufe === 'erinnern' ? 'Zuletzt gesichert ' + wieLang + ' — Zeit für eine neue'
      : 'Zuletzt gesichert ' + wieLang + ' — das ist lange her';
    const art = st.art === 'json'
      ? 'JSON · ohne Anhänge'
      : st.art === 'redion' ? '.redion · mit Anhängen' : '';

    const frist = !pk.anzahl ? 'nichts weggelegt'
      : !pk.tage ? pk.anzahl + (pk.anzahl === 1 ? ' Sache liegt weg' : ' Sachen liegen weg') +
          ' · keine Frist'
      : pk.anzahl + (pk.anzahl === 1 ? ' Sache liegt weg' : ' Sachen liegen weg') +
          (pk.naechste === null ? '' :
            pk.naechste === 0 ? ' · die nächste läuft heute ab'
            : pk.naechste === 1 ? ' · die nächste läuft morgen ab'
            : ' · noch ' + pk.naechste + ' Tage für die nächste');

    return '<section class="bib-abschnitt"><header><h2>Sicherung und Papierkorb</h2>' +
      '<p>alles auf diesem Gerät</p></header><div class="bib-pflege">' +
      `<div class="bib-pflege-karte bib-sicher-${esc(st.stufe)}">` +
        `<span class="bib-pflege-zeichen" data-sym="${st.stufe === 'gut' ? 'checkCircle' : 'bell'}" aria-hidden="true"></span>` +
        '<span><strong>' + esc(satz) + '</strong><small>' +
          (art || 'Eine vollständige Sicherung nimmt Seiten UND Anhänge mit') +
        '</small></span>' +
        '<button type="button" data-a="sichern">Jetzt sichern</button></div>' +
      '<div class="bib-pflege-karte">' +
        '<span class="bib-pflege-zeichen" data-sym="trash" aria-hidden="true"></span>' +
        '<span><strong>Papierkorb</strong><small>' + esc(frist) + '</small></span>' +
        '<button type="button" data-a="papierkorb">Öffnen</button></div>' +
      '</div></section>';
  };

  /* Der Platz kommt als Versprechen und wird deshalb NACHGETRAGEN. Die Stelle
     steht sofort da und sagt, dass gerechnet wird — ein Kasten, der aus dem
     Nichts erscheint, verschiebt alles darunter, während man liest. */
  const platzKarte = (): string =>
    '<section class="bib-abschnitt" data-bib-platz><header><h2>Platz auf dem Gerät</h2>' +
    '<p>wird gemessen …</p></header></section>';

  const platzNachtragen = (wrap: HTMLElement): void => {
    const stelle = wrap.querySelector<HTMLElement>('[data-bib-platz]');
    if (!stelle) return;
    void Sicherung.platz().then(p => {
      if (!stelle.isConnected) return;
      if (!p.bekannt) {
        /* KEINE ERFUNDENE ZAHL. Manche Browser geben `estimate()` nicht
           heraus; dann steht hier, was bekannt ist, und sonst nichts. */
        stelle.innerHTML = '<header><h2>Platz auf dem Gerät</h2></header>' +
          '<p class="bib-platz-unbekannt">Dieser Browser sagt nicht, wieviel Platz ' +
          'Redion belegt.' + (p.anhaenge
            ? ' Die Anhänge allein sind ' + esc(Sicherung.groesse(p.anhaenge)) + '.'
            : '') + '</p>';
        return;
      }
      const anteil = Math.min(100, Math.round(p.belegt / p.gesamt * 1000) / 10);
      const anhangAnteil = p.belegt ? Math.min(100, p.anhaenge / p.belegt * 100) : 0;
      stelle.innerHTML = '<header><h2>Platz auf dem Gerät</h2>' +
        '<p>' + esc(Sicherung.groesse(p.belegt)) + ' von ' +
          esc(Sicherung.groesse(p.gesamt)) + ' · ' +
          anteil.toLocaleString('de-CH') + ' %</p></header>' +
        '<div class="bib-platz-balken" role="img" aria-label="' +
          esc(Sicherung.groesse(p.belegt) + ' von ' + Sicherung.groesse(p.gesamt) + ' belegt') + '">' +
          '<i style="width:' + anteil + '%"><b style="width:' + anhangAnteil + '%"></b></i>' +
        '</div>' +
        '<p class="bib-platz-teile">' +
          '<span class="bib-platz-anhang"></span>Anhänge ' +
            esc(Sicherung.groesse(p.anhaenge)) +
          '<span class="bib-platz-rest"></span>Seiten und Verwaltung ' +
            esc(Sicherung.groesse(Math.max(0, p.belegt - p.anhaenge))) +
        '</p>' +
        /* Der Browser rechnet seinen eigenen Verwaltungsaufwand mit; die
           beiden Zahlen müssen nicht aufgehen, und das steht hier auch. */
        '<p class="bib-platz-hinweis">Geschätzt — der Browser meldet die ' +
        'Gesamtgrösse, die Aufteilung kommt aus dem Bestand.</p>';
    });
  };

  /* ---------------------------------------------------------------- *
   * DIE DECKELANSICHT (E236)
   * ---------------------------------------------------------------- */
  const zeichneDeckel = (wrap: HTMLElement): void => {
    const alle = gefiltert();
    const liste = zustand.art === 'alle'
      ? alle : alle.filter(p => artVon(p).id === zustand.art);

    /* Welche Arten es überhaupt GIBT — ein Filter für eine Art, die
       niemand hat, ist ein Knopf, der immer leer antwortet. */
    const vorhanden = new Set(alle.map(p => artVon(p).id as string));

    wrap.innerHTML =
      '<div class="bib bib-deckel-seite">' +
        deckelKopf(alle.length) +
        '<div class="bib-arten" role="group" aria-label="Nach Art filtern">' +
          ART_FILTER.filter(a => a.id === 'alle' || vorhanden.has(a.id) ||
                                 a.id === zustand.art)
            .map(a => `<button data-art="${esc(a.id)}"` +
              (zustand.art === a.id ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') +
              `>${esc(a.name)}</button>`).join('') +
        '</div>' +
        (liste.length
          ? '<div class="bib-gitter">' + liste.map(deckelKarte).join('') + '</div>'
          : '<p class="bib-leer">' + (zustand.art === 'alle'
              ? 'Hier ist noch nichts. Tippe auf „Neu", um anzufangen.'
              : 'Von dieser Art gibt es hier nichts.') + '</p>') +
        /* DIE SICHERUNG UND DER PLATZ GEHÖREN IN JEDE FORM.
           Der erste Entwurf liess beide weg — sie standen nur im
           Heftregal, und das ist seit E236 nicht mehr die Vorgabe. Damit
           war die Warnung „du hast noch nie gesichert" aus der Ansicht
           verschwunden, die jetzt jeder zuerst sieht.

           Das ist keine Zierde: §11 nennt die Sicherung eine
           Sicherheitsfunktion, und §46 stellt Datenintegrität vor alles
           andere. Eine Warnung, die man nur in einer Ansicht sieht, die
           kaum jemand öffnet, ist keine Warnung. */
        sicherungsKarte() +
        platzKarte() +
      '</div>';

    if (typeof Register !== 'undefined' && Register.symbole)
      Register.symbole.fuelle(wrap);
    binde(wrap);
    platzNachtragen(wrap);
  };

  /**
   * Der Kopf der Deckelansicht: Titel, „+ Neu", Formwahl.
   *
   * ER IST NICHT `bibKopf`. Der alte Kopf trägt die Reiter (wo liegt es)
   * und zwei Formknöpfe; dieser trägt die Handlung. Beide zusammen wären
   * vier Bänke übereinander — genau das, was Redur rot angestrichen hat.
   * Die Reiter sind deshalb hier ein Menü hinter dem Titel.
   */
  /**
   * Der Kopf der Deckelansicht: Titel, „+ Neu", Formwahl.
   *
   * DER TITEL HEISST „DOKUMENTE" UND NICHT WIE DER REITER. Der erste
   * Entwurf setzte den Reiternamen als Überschrift — und „Kürzlich
   * verwendet" ist bei 24 px so breit, dass der Neu-Knopf in die nächste
   * Zeile fiel und aus einer Bank zwei wurden. Ausserdem stimmt es nicht:
   * die Seite IST das Regal, der Reiter ist nur ein Filter darauf. Er
   * steht deshalb klein darunter, zusammen mit der Zahl.
   */
  const deckelKopf = (anzahl: number): string => {
    const ort = REITER.find(r => r.id === zustand.reiter)?.name || 'Alle';
    return '<header class="bib-dkopf">' +
      '<h1>Dokumente</h1>' +
      '<button class="bib-neu" data-neu-auf>' +
        '<b aria-hidden="true">+</b><span>Neu</span></button>' +
      '<button class="bib-form-knopf" data-form="liste" ' +
        'aria-label="Als Liste anzeigen">\u2630</button>' +
      '<button class="bib-ort" data-orte aria-haspopup="menu">' +
        esc(ort) + ' \u00b7 ' + anzahl + (anzahl === 1 ? ' Dokument' : ' Dokumente') +
        '<i aria-hidden="true">\u25be</i></button>' +
    '</header>';
  };

  const zeichneRegal = (wrap: HTMLElement): void => {
    const liste = gefiltert();
    const regal = hefte(liste);
    /* „Zuletzt in der Hand" ist bewusst NICHT dasselbe wie das Regal: dort
       steht je Heft die neueste Seite, hier die neuesten Seiten überhaupt.
       Wer den ganzen Tag in einem Heft war, sieht hier seinen Tag. */
    const hand = liste.slice()
      .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
      /* VIER, NICHT FÜNF. Dieselbe Waise wie bei den Kennzahlen in E204:
         fünf Karten in einem Vierspalter lassen eine allein in der zweiten
         Reihe stehen, daneben drei Viertel weisse Fläche. */
      .slice(0, 4);

    wrap.innerHTML =
      '<div class="bib bib-regal-seite">' +
        bibKopf(liste, regal.length) +
        (regal.length
          ? '<div class="bib-regal">' + regal.map(heftKarte).join('') + '</div>'
          : '<p class="bib-leer">Hier ist noch nichts. Seiten erscheinen automatisch.</p>') +
        (hand.length > 1
          ? '<section class="bib-abschnitt"><header><h2>Zuletzt in der Hand</h2>' +
              '<p>heftübergreifend</p></header>' +
              '<div class="bib-hand-reihe">' + hand.map(handKarte).join('') + '</div></section>'
          : '') +
        sicherungsKarte() +
        platzKarte() +
      '</div>';

    if (typeof Register !== 'undefined' && Register.symbole)
      Register.symbole.fuelle(wrap);
    binde(wrap);
    platzNachtragen(wrap);
  };

  /** Was in beiden Formen gleich funktioniert: öffnen und umschalten. */
  const binde = (wrap: HTMLElement): void => {
    wrap.querySelectorAll<HTMLElement>('.bib-reiter [data-r]').forEach(b =>
      b.addEventListener('click', () => {
        if (b.dataset['r'] === 'mehr') {
          const r = b.getBoundingClientRect();
          const m = UI.menu(REITER.slice(4).map(x =>
            `<button data-x="${x.id}"><span class="mi">${x.icon}</span>${esc(x.name)}</button>`).join(''),
            r.left, r.bottom + 4);
          m.addEventListener('click', ev => {
            const x = elVon(ev)?.closest<HTMLElement>('[data-x]');
            if (!x) return;
            zustand.reiter = x.dataset['x'] ?? zustand.reiter; m.remove(); App.zeichneSeite();
          });
          return;
        }
        zustand.reiter = b.dataset['r'] ?? zustand.reiter;
        App.zeichneSeite();
      }));
    wrap.querySelectorAll<HTMLElement>('[data-form]').forEach(b =>
      b.addEventListener('click', () => {
        const f = b.dataset['form'] === 'liste' ? 'liste' : 'regal';
        Store.setMeta('bibForm', f);
        App.zeichneSeite();
      }));
    wrap.querySelectorAll<HTMLElement>('.bib-pflege [data-a]').forEach(b =>
      b.addEventListener('click', ereignis => {
        ereignis.stopPropagation();
        if (b.dataset['a'] === 'papierkorb') { App.papierkorb(); return; }
        /* Gesichert wird über denselben Weg wie im Menü — ein zweiter
           Sicherungspfad wäre ein zweiter, der schiefgehen kann, und nur
           einer von beiden hält den Zeitpunkt fest. */
        void App.sicherungSpeichern();
      }));
    wrap.querySelectorAll<HTMLElement>('.bib-heft[data-id], .bib-hand[data-id]').forEach(k =>
      k.addEventListener('click', () => {
        const id = k.dataset['id'];
        if (id) App.oeffne(id);
      }));

    /* --- Die Deckelansicht (E236) ---------------------------------- */
    wrap.querySelectorAll<HTMLElement>('.bib-arten [data-art]').forEach(b =>
      b.addEventListener('click', () => {
        zustand.art = b.dataset['art'] ?? 'alle';
        App.zeichneSeite();
      }));
    wrap.querySelectorAll<HTMLElement>('[data-orte]').forEach(b =>
      b.addEventListener('click', () => {
        const r = b.getBoundingClientRect();
        /* Die Reiter als Menü hinter dem Titel — dieselbe Liste wie in der
           Tabelle, nur nicht als eigene Bank. Sonst stünden hier vier
           Zeilen übereinander, bevor das erste Dokument kommt. */
        const m = UI.menu(REITER.map(x =>
          `<button data-x="${x.id}"${zustand.reiter === x.id ? ' class="on"' : ''}>` +
          `<span class="mi">${x.icon}</span>${esc(x.name)}</button>`).join('') +
          '<div class="sep"></div>' +
          '<button data-x="__regal"><span class="mi">\u25a4</span>Nach Heften ordnen</button>' +
          '<button data-x="__liste"><span class="mi">\u2630</span>Als Tabelle</button>',
          r.left, r.bottom + 6);
        m.addEventListener('click', ev => {
          const x = elVon(ev)?.closest<HTMLElement>('[data-x]');
          if (!x) return;
          const wahl = x.dataset['x'] ?? '';
          m.remove();
          if (wahl === '__regal')      { Store.setMeta('bibForm', 'regal'); }
          else if (wahl === '__liste') { Store.setMeta('bibForm', 'liste'); }
          else { zustand.reiter = wahl || zustand.reiter; zustand.art = 'alle'; }
          App.zeichneSeite();
        });
      }));
    wrap.querySelectorAll<HTMLElement>('[data-neu-auf]').forEach(b =>
      b.addEventListener('click', () => App.erstellenBlatt()));
    wrap.querySelectorAll<HTMLElement>('.bib-deckel[data-id]').forEach(k => {
      k.addEventListener('click', ereignis => {
        /* Der Pfeil im Namen öffnet das Menü zum Stück, nicht das Stück. */
        if (ereignis.target instanceof Element &&
            ereignis.target.closest('.bib-deckel-mehr')) return;
        const id = k.dataset['id'];
        if (id) App.oeffne(id);
      });
      k.querySelector<HTMLElement>('.bib-deckel-mehr')?.addEventListener('click', ereignis => {
        ereignis.stopPropagation();
        const id = k.dataset['id'];
        const p = id ? Store.getBlock(id) : null;
        if (!p) return;
        const r = k.getBoundingClientRect();
        const m = UI.menu(
          `<button data-a="oeffnen"><span class="mi">\u2197</span>Öffnen</button>` +
          `<button data-a="stern"><span class="mi">${p.favorite ? '\u2605' : '\u2606'}</span>` +
            (p.favorite ? 'Aus Favoriten' : 'Zu Favoriten') + '</button>' +
          '<button data-a="umbenennen"><span class="mi">\u270e</span>Umbenennen</button>' +
          '<div class="sep"></div>' +
          '<button data-a="papierkorb"><span class="mi">\u2327</span>In den Papierkorb</button>',
          Math.min(r.left, innerWidth - 230), r.bottom + 4);
        m.addEventListener('click', ev => {
          const b = elVon(ev)?.closest<HTMLElement>('[data-a]');
          if (!b) return;
          const a = b.dataset['a'];
          m.remove();
          if (a === 'oeffnen') { App.oeffne(p.id); return; }
          if (a === 'stern')   { Store.updateBlock(p.id, { favorite: !p.favorite }); }
          if (a === 'umbenennen') {
            /* Umbenannt wird auf der Seite selbst — ein zweites Eingabefeld
               für denselben Titel wäre eine zweite Wahrheit (§8). */
            App.oeffne(p.id);
            setTimeout(() => document.getElementById('title')?.focus(), 80);
            return;
          }
          if (a === 'papierkorb') {
            /* NICHT LÖSCHEN, SONDERN IN DEN PAPIERKORB. `alive: false` ist
               umkehrbar; `Store.removeBlock` wäre es nicht (§46). */
            Store.updateBlock(p.id, { alive: false });
            UI.toast('„' + (p.text || 'Ohne Titel') + '" liegt im Papierkorb');
          }
          App.zeichneSeite();
        });
      });
    });
  };

  const zeichnen = (wrap: HTMLElement): void => {
    if (zustand.reiter === 'schule') { zeichneSchule(wrap); return; }
    if (form() === 'deckel') { zeichneDeckel(wrap); return; }
    if (form() === 'regal') { zeichneRegal(wrap); return; }
    const liste = gefiltert();
    const spalten = SPALTEN.filter(s => zustand.spalten.includes(s.id));
    const raster = spalten.map(s => s.breit).join(' ');

    wrap.innerHTML =
      '<div class="bib">' +
        bibKopf(liste, hefte(liste).length) +
        /* Eigene Klasse: `bib-kopf` trägt seit E207 Reiter und Umschalter und
           steht in BEIDEN Formen. Zwei Elemente mit demselben Namen auf einer
           Seite sind zwei Dinge, die gleich aussehen sollen und es beim
           nächsten Stilzusatz nicht mehr tun. */
        '<div class="bib-kopf bib-kopf-liste">' +
          '<div class="bib-werkzeuge">' +
            '<button data-a="filter" title="Filtern">⚟</button>' +
            '<button data-a="suche" title="Suchen">🔍</button>' +
            '<button data-a="spalten" title="Eigenschaften">⚙</button>' +
            '<button data-a="neu" class="prim">Neue Seite</button>' +
          '</div>' +
        '</div>' +
        (zustand.sucheOffen
          ? `<div class="bib-suchzeile">🔍 <input id="bib-suche" value="${esc(zustand.suche)}" ` +
            'placeholder="Seiten durchsuchen …"><button data-a="suchzu">✕</button></div>' : '') +
        `<div class="bib-tab" style="--bib-raster:${raster}">` +
          '<div class="bib-zeile bib-kopfzeile">' +
            spalten.map(s =>
              `<div data-s="${s.id}"><span>${s.icon}</span>${esc(s.name)}` +
              (zustand.sortier === s.id ? `<em>${zustand.richtung === 'auf' ? '↑' : '↓'}</em>` : '') +
              '</div>').join('') +
          '</div>' +
          (liste.length
            ? liste.map(p => {
                const q = quelleVon(p);
                const kinder = Store.childrenOf(p.id)
                  .filter((k: any) => k.type === 'page' &&
                    (k.parentTable === 'collection'
                      ? collectionPermitted('lesen', k.parentId)
                      : permitted('lesen', k.id))).length;
                const zellen: Record<string, string> = {
                  name: `<div class="bib-name">${kinder ? '<b class="bib-pfeil">▸</b>' : '<b class="bib-pfeil leer"></b>'}` +
                        `<span class="bib-ico">${p.icon || (p.parentTable === 'collection' ? '▦' : '📄')}</span>` +
                        `<span class="bib-txt">${esc(p.text || 'Ohne Titel')}</span></div>`,
                  von:  `<div class="bib-person"><span class="bib-kreis">` +
                        `${esc((p.erstelltVon || 'Ich').slice(0, 1).toUpperCase())}</span>` +
                        `${esc(p.erstelltVon || 'Ich')}</div>`,
                  quelle: `<div class="bib-quelle"><span>${q.icon}</span>${esc(q.text)}</div>`,
                  wann: `<div class="bib-wann">${esc(wannText(p.edited || p.created))}</div>`
                };
                return `<div class="bib-zeile" data-id="${p.id}">` +
                       spalten.map(s => zellen[s.id]).join('') + '</div>';
              }).join('')
            : '<div class="bib-leer">Hier ist noch nichts. Seiten erscheinen automatisch.</div>') +
        '</div>' +
        `<div class="bib-fuss">${liste.length} ${liste.length === 1 ? 'Seite' : 'Seiten'}</div>` +
      '</div>';

    if (typeof Register !== 'undefined' && Register.symbole)
      Register.symbole.fuelle(wrap);
    binde(wrap);

    /* Die Reiter bindet `binde()` — sie stehen jetzt im gemeinsamen Kopf
       und gehören beiden Formen. Hier stand dieselbe Schleife ein zweites
       Mal; zwei Bindungen an einem Knopf hätten ihn doppelt ausgelöst. */

    /* Sortieren durch Klick auf den Spaltenkopf */
    wrap.querySelectorAll('.bib-kopfzeile [data-s]').forEach((d: any) =>
      d.addEventListener('click', () => {
        if (zustand.sortier === d.dataset.s)
          zustand.richtung = zustand.richtung === 'auf' ? 'ab' : 'auf';
        else { zustand.sortier = d.dataset.s; zustand.richtung = 'auf'; }
        App.zeichneSeite();
      }));

    /* Zeile öffnen */
    wrap.querySelectorAll('.bib-zeile[data-id]').forEach((z: any) =>
      z.addEventListener('click', () => App.oeffne(z.dataset.id)));

    /* Werkzeuge */
    wrap.querySelectorAll('.bib-werkzeuge button, [data-a="suchzu"]').forEach((b: any) =>
      b.addEventListener('click', () => {
        const a = b.dataset.a;
        if (a === 'neu') {
          if (!permitted('bearbeiten')) {
            UI.toast('Du darfst hier keine neue Seite anlegen.');
            return;
          }
          const p = Store.addPage(null, { text: '' });
          App.oeffne(p.id);
          setTimeout(() => document.getElementById('title')?.focus(), 60);
        }
        if (a === 'suche')  { zustand.sucheOffen = true; App.zeichneSeite();
                              document.getElementById('bib-suche')?.focus(); }
        if (a === 'suchzu') { zustand.suche = ''; zustand.sucheOffen = false; App.zeichneSeite(); }
        if (a === 'filter') {
          const r = b.getBoundingClientRect();
          const m = UI.menu('<div class="grp">Nur zeigen</div>' +
            REITER.map(x => `<button data-x="${x.id}"><span class="mi">${x.icon}</span>${esc(x.name)}` +
              (zustand.reiter === x.id ? '<span class="ms">✓</span>' : '') + '</button>').join(''),
            r.left - 160, r.bottom + 4);
          m.addEventListener('click', ev => {
            const x = elVon(ev)?.closest<HTMLElement>('[data-x]');
            if (!x) return;
            zustand.reiter = x.dataset.x ?? zustand.reiter; m.remove(); App.zeichneSeite();
          });
        }
        if (a === 'spalten') {
          const r = b.getBoundingClientRect();
          const m = UI.menu('<div class="grp">Eigenschaften</div>' +
            SPALTEN.map(s => `<button data-x="${s.id}"><span class="mi">${s.icon}</span>${esc(s.name)}` +
              `<span class="ms">${zustand.spalten.includes(s.id) ? 'an' : 'aus'}</span></button>`).join(''),
            r.left - 160, r.bottom + 4);
          m.addEventListener('click', ev => {
            const x = elVon(ev)?.closest<HTMLElement>('[data-x]');
            if (!x) return;
            const sid = x.dataset.x;
            if (!sid || sid === 'name') return;          /* Der Name bleibt */
            zustand.spalten = zustand.spalten.includes(sid)
              ? zustand.spalten.filter(y => y !== sid)
              : [...zustand.spalten, sid];
            m.remove(); App.zeichneSeite();
          });
        }
      }));

    const si = document.getElementById('bib-suche') as HTMLInputElement | null;
    if (si) {
      si.addEventListener('input', () => {
        zustand.suche = si.value;
        const stelle = si.selectionStart;
        App.zeichneSeite();
        const neu = document.getElementById('bib-suche') as HTMLInputElement | null;
        if (neu) { neu.focus(); neu.setSelectionRange(stelle, stelle); }
      });
    }
  };

  /**
   * Das Regal öffnen.
   *
   * ZWEI SACHEN STEHEN HIER UND NICHT BEIM AUFRUFER (E236).
   *
   * `Seitenleiste.reiter('dokumente')` markiert den Weg unten. Er stand
   * zuerst nur im Knopf `hl-dok` — und damit leuchtete unten „Heute",
   * sobald das Regal von woanders aufging: vom Start, aus dem Mehr-Blatt,
   * über einen Verweis. Eine Markierung, die nur bei EINEM von vier Wegen
   * stimmt, ist schlimmer als keine.
   *
   * Und der Name lautet „Dokumente", nicht „Bibliothek": die Seite
   * schreibt es gross darüber, Redur nennt es so, und zwei Namen für
   * dieselbe Sache sind einer zu viel. Das Modul heisst weiter
   * `Bibliothek` — es ist der Ordner, nicht die Aufschrift.
   */
  const oeffne = (): void => {
    try { Seitenleiste.reiter('dokumente'); } catch { /* ohne Leiste kein Reiter */ }
    App.zeigeSonder('Dokumente', zeichnen);
  };

  /* ------------------------------------------------------------------ *
   * MEINE AUFGABEN
   *
   * Notion sammelt hier alle Zeilen, in denen eine Person-Eigenschaft auf
   * dich zeigt und ein Status/Kontrollkästchen offen ist. Welche Datenbanken
   * dazugehören, lässt sich einstellen — genau das macht
   * „Aufgabenquellen konfigurieren".
   * ------------------------------------------------------------------ */

  const quellenLesen = (): any => Store.getMeta('aufgabenQuellen', null);

  /**
   * Alle Datenbanken, die als Aufgabenquelle taugen. Wurde eine ausdrücklich
   * „In Aufgaben umgewandelt", zählt sie in jedem Fall — das ist Notions
   * eigener Schalter unter Weitere Einstellungen.
   */
  const moegliche = (): any[] => Object.values<any>(Store.cache.collections).filter(c => {
    if (!collectionPermitted('lesen', c.id)) return false;
    if (c.istAufgaben) return true;
    const t = Object.values<any>(c.schema || {}).map(d => d.type);
    return t.includes('checkbox') || t.includes('status');
  });

  const meineAufgaben = (): any[] => {
    const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
    const meinName = (konto && konto.name) || 'Ich';
    const gewaehlt = quellenLesen();
    const quellen = moegliche().filter(c => !gewaehlt || gewaehlt.includes(c.id));
    const raus: any[] = [];

    quellen.forEach(coll => {
      const schema = coll.schema || {};
      const personKey  = Object.keys(schema).find(k => schema[k].type === 'person');
      const statusKey  = Object.keys(schema).find(k => schema[k].type === 'status');
      const hakenKey   = Object.keys(schema).find(k => schema[k].type === 'checkbox');
      const datumKey   = Object.keys(schema).find(k => schema[k].type === 'date');
      const titelKey   = Object.keys(schema).find(k => schema[k].type === 'title') || 'name';

      Store.rowsOf(coll.id).forEach((row: any) => {
        const pr = row.props || {};
        /* WEM GEHÖRT EINE ZEILE?
           Die Personenspalte sagt es, wenn sie gefüllt ist. Sonst gehört die
           Zeile dem, der sie ansieht — auf einem Bestand, der auf diesem
           Gerät liegt, ist das die einzige Lesart, und in einem geteilten
           Arbeitsbereich gibt es die Personenspalte genau dafür.

           VORHER STAND HIER EIN VERGLEICH MIT DEM ANLEGER, und der hat
           gekostet: `Store.addRow` schrieb `erstelltVon` gar nicht, also lief
           der Vergleich gegen den Ersatzwert „Ich". Gemessen am 25. August —
           derselbe Bestand, nur der Name in den Einstellungen geändert:

               Name leer („Ich")   5 Aufgaben
               Name „Redur"        0 Aufgaben

           Die ganze Aufgabenliste war weg, und nichts sagte warum. Und selbst
           mit geschriebenem `erstelltVon` wäre es falsch geblieben: wer sich
           umbenennt, verliert sonst rückwirkend, was er angelegt hat.

           Eine leere Personenzelle zählt aus demselben Grund wie eine
           fehlende Spalte — beide Male steht nirgends ein anderer Name
           (E152). */
        const wer = personKey ? String(pr[personKey] || '').trim() : '';
        const meins = !wer || wer.toLowerCase().includes(meinName.toLowerCase());
        if (!meins) return;
        const fertig = hakenKey ? !!pr[hakenKey]
          : statusKey ? /fertig|erledigt|done|abgeschlossen/i.test(String(pr[statusKey] || '')) : false;
        raus.push({
          id: row.id, coll,
          pageId: collectionPageId(coll.id),
          titel: pr[titelKey] || row.text || 'Ohne Titel',
          status: statusKey ? (pr[statusKey] || '—') : (fertig ? 'Fertig' : 'Offen'),
          datum: datumKey ? pr[datumKey] : '',
          fertig, hakenKey, statusKey,
          bearbeitbar: collectionPermitted('bearbeiten', coll.id)
        });
      });
    });

    raus.sort((a, b) => (a.fertig ? 1 : 0) - (b.fertig ? 1 : 0) ||
      String(a.datum || '9999').localeCompare(String(b.datum || '9999')));
    return raus;
  };

  /* Filter, Sortierung und Suche der Aufgabenseite */
  let aZustand = { nurOffen: false, sortier: 'datum', suche: '', sucheOffen: false };

  const zeichneAufgaben = (wrap: HTMLElement): void => {
    let liste = meineAufgaben();
    if (aZustand.nurOffen) liste = liste.filter(a => !a.fertig);
    if (aZustand.suche) {
      const s = aZustand.suche.toLowerCase();
      liste = liste.filter(a => a.titel.toLowerCase().includes(s));
    }
    if (aZustand.sortier === 'titel')
      liste = [...liste].sort((a, b) => a.titel.localeCompare(b.titel));
    if (aZustand.sortier === 'datenbank')
      liste = [...liste].sort((a, b) => a.coll.name.localeCompare(b.coll.name));

    const offen = liste.filter(a => !a.fertig);
    const fertig = liste.filter(a => a.fertig);

    wrap.innerHTML =
      '<div class="bib">' +
        '<h1 class="bib-titel">Meine Aufgaben</h1>' +
        '<div class="bib-kopf">' +
          '<div class="bib-reiter">' +
            '<button class="on"><span>☑</span>Meine Aufgaben</button>' +
          '</div>' +
          '<div class="bib-werkzeuge">' +
            `<button data-a="afilter" title="Filtern"${aZustand.nurOffen ? ' class="an"' : ''}>⚟</button>` +
            '<button data-a="asort" title="Sortieren">↕</button>' +
            '<button data-a="asuche" title="Suchen">🔍</button>' +
            '<button data-a="quellen" title="Aufgabenquellen">⚙</button>' +
            '<button data-a="neu" class="prim">Neue Aufgabe</button>' +
          '</div>' +
        '</div>' +
        (aZustand.sucheOffen
          ? `<div class="bib-suchzeile">🔍 <input id="auf-suche" value="${esc(aZustand.suche)}" ` +
            'placeholder="Aufgaben durchsuchen …"><button data-a="asuchzu">✕</button></div>' : '') +
        (liste.length
          ? '<div class="auf-liste">' +
              (offen.length ? `<div class="auf-grp">Offen <em>${offen.length}</em></div>` : '') +
              offen.map(a => zeileHtml(a)).join('') +
              (fertig.length ? `<div class="auf-grp">Erledigt <em>${fertig.length}</em></div>` : '') +
              fertig.map(a => zeileHtml(a)).join('') +
            '</div>'
          : '<div class="auf-leer">' +
              '<div class="auf-leer-ico">☑</div>' +
              '<div>Hier findest du alle dir zugewiesenen Aufgaben.</div>' +
              '<button data-a="quellen" class="auf-link">Aufgabenquellen konfigurieren</button>' +
            '</div>') +
      '</div>';

    wrap.querySelectorAll('[data-a="quellen"]').forEach((b: any) =>
      b.addEventListener('click', quellenDialog));

    wrap.querySelector('[data-a="afilter"]')?.addEventListener('click', (e: any) => {
      const r = e.currentTarget.getBoundingClientRect();
      const m = UI.menu('<div class="grp">Zeigen</div>' +
        `<button data-x="alle">Alle Aufgaben${aZustand.nurOffen ? '' : '<span class="ms">✓</span>'}</button>` +
        `<button data-x="offen">Nur offene${aZustand.nurOffen ? '<span class="ms">✓</span>' : ''}</button>`,
        r.left - 130, r.bottom + 4);
      m.addEventListener('click', ev => {
        const x = elVon(ev)?.closest<HTMLElement>('[data-x]');
        if (!x) return;
        aZustand.nurOffen = x.dataset.x === 'offen';
        m.remove(); App.zeichneSeite();
      });
    });

    wrap.querySelector('[data-a="asort"]')?.addEventListener('click', (e: any) => {
      const r = e.currentTarget.getBoundingClientRect();
      const m = UI.menu('<div class="grp">Sortieren nach</div>' +
        [['datum', 'Frist'], ['titel', 'Name'], ['datenbank', 'Datenbank']].map(([id, n]) =>
          `<button data-x="${id}">${n}${aZustand.sortier === id ? '<span class="ms">✓</span>' : ''}</button>`).join(''),
        r.left - 130, r.bottom + 4);
      m.addEventListener('click', ev => {
        const x = elVon(ev)?.closest<HTMLElement>('[data-x]');
        if (!x) return;
        aZustand.sortier = x.dataset.x ?? aZustand.sortier;
        m.remove(); App.zeichneSeite();
      });
    });

    wrap.querySelector('[data-a="asuche"]')?.addEventListener('click', () => {
      aZustand.sucheOffen = true;
      App.zeichneSeite();
      document.getElementById('auf-suche')?.focus();
    });
    wrap.querySelector('[data-a="asuchzu"]')?.addEventListener('click', () => {
      aZustand.suche = ''; aZustand.sucheOffen = false; App.zeichneSeite();
    });
    const si2 = wrap.querySelector('#auf-suche') as HTMLInputElement | null;
    if (si2) si2.addEventListener('input', () => {
      aZustand.suche = si2.value;
      const stelle = si2.selectionStart;
      App.zeichneSeite();
      const neu = document.getElementById('auf-suche') as HTMLInputElement | null;
      if (neu) { neu.focus(); neu.setSelectionRange(stelle, stelle); }
    });
    wrap.querySelector('[data-a="neu"]')?.addEventListener('click', () => {
      const dbs = moegliche().filter(coll => collectionPermitted('bearbeiten', coll.id));
      if (!dbs.length) {
        UI.toast('Keine bearbeitbare Aufgabendatenbank verfügbar.');
        return;
      }
      const coll = dbs[0];
      const row = Store.addRow(coll.id, {});
      App.oeffne(row.id);
    });

    wrap.querySelectorAll('.auf-zeile').forEach((z: any) => {
      z.querySelector('.auf-haken')?.addEventListener('click', (e: any) => {
        e.stopPropagation();
        const a = liste.find(x => x.id === z.dataset.id);
        if (!a) return;
        if (!a.bearbeitbar || !permitted('bearbeiten', a.pageId)) {
          UI.toast('Du darfst diese Aufgabe nicht ändern.');
          return;
        }
        const row = Store.getBlock(a.id);
        const props = { ...(row.props || {}) };
        if (a.hakenKey) props[a.hakenKey] = !a.fertig;
        else if (a.statusKey) props[a.statusKey] = a.fertig ? 'Offen' : 'Fertig';
        Store.updateBlock(a.id, { props });
        App.zeichneSeite();
      });
      z.addEventListener('click', () => App.oeffne(z.dataset.id));
    });
  };

  const zeileHtml = (a: any): string =>
    `<div class="auf-zeile${a.fertig ? ' fertig' : ''}" data-id="${a.id}">` +
      `<button class="auf-haken"${a.bearbeitbar ? '' : ' disabled title="Nur Leserechte"'}>` +
        `${a.fertig ? '☑' : '☐'}</button>` +
      `<span class="auf-titel">${esc(a.titel)}</span>` +
      `<span class="auf-db">▦ ${esc(a.coll.name)}</span>` +
      (a.datum ? `<span class="auf-datum">${esc(String(a.datum).slice(0, 10))}</span>` : '') +
      `<span class="auf-status">${esc(a.status)}</span>` +
    '</div>';

  const quellenDialog = (): void => {
    const dbs = moegliche();
    const gewaehlt = quellenLesen();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<div class="fh">Aufgabenquellen<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" style="padding:6px">' +
          (dbs.length
            ? dbs.map(c => {
                const an = !gewaehlt || gewaehlt.includes(c.id);
                return `<button data-c="${c.id}"><span>▦</span>` +
                  `<span style="flex:1">${esc(c.name)}</span>` +
                  `<span class="pth">${an ? 'zählt mit' : 'aus'}</span></button>`;
              }).join('')
            : '<div style="padding:16px;color:var(--text-faint);font-size:14px">' +
              'Noch keine Datenbank mit Status oder Kontrollkästchen.</div>') +
        '</div>' +
        '<div class="hint">Eine Zeile gilt als deine Aufgabe, wenn eine Person-Spalte auf ' +
        'dich zeigt — oder, wenn es keine gibt, wenn du sie angelegt hast.</div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const b = elVon(e)?.closest<HTMLElement>('[data-c]');
      if (!b) return;
      if (!permitted('bearbeiten')) {
        UI.toast('Du darfst die Aufgabenquellen nicht ändern.');
        return;
      }
      const alle = dbs.map(c => c.id);
      const jetzt = quellenLesen() || alle;
      const neu = jetzt.includes(b.dataset.c) ? jetzt.filter((x: any) => x !== b.dataset.c) : [...jetzt, b.dataset.c];
      Store.setMeta('aufgabenQuellen', neu);
      o.remove(); quellenDialog(); App.zeichneSeite();
    });
  };

  const aufgaben = (): void => App.zeigeSonder('Meine Aufgaben', zeichneAufgaben);

  return { oeffne, aufgaben, meineAufgaben, quellenDialog, alleSeiten, quelleVon, wannText };
})();

(window as any).Bibliothek = Bibliothek;

/* Die Bibliothek meldet ihre Kontextkante an (E272 Phase F). */
if (typeof Register !== 'undefined' && (Register as any).kontext) {
  const K = (Register as any).kontext;
  K.melde({ bereich: 'bibliothek', id: 'uebersicht', name: 'Übersicht',
    zeichen: 'library', rang: 10, tun: () => Bibliothek.oeffne() });
  K.melde({ bereich: 'bibliothek', id: 'notizhefte', name: 'Notizhefte',
    zeichen: 'book', rang: 20,
    zeigen: () => typeof Notebook !== 'undefined' && !!Notebook.oeffnen,
    tun: () => Notebook.oeffnen() });
  K.melde({ bereich: 'bibliothek', id: 'aufgaben', name: 'Aufgaben',
    zeichen: 'tasks', rang: 30, tun: () => Bibliothek.aufgaben() });
  K.melde({ bereich: 'bibliothek', id: 'alle', name: 'Alle Seiten',
    zeichen: 'pages', rang: 40, tun: () => Bibliothek.alleSeiten() });
  K.melde({ bereich: 'bibliothek', id: 'suche', name: 'Suchen',
    zeichen: 'search', rang: 50, tun: () => App.suche() });
  /* ZULETZT GEÖFFNET ist eine Lade und kein Knopf: eine Liste, die sich
     bei jedem Öffnen ändert, darf nicht beim Zeichnen der Kante entstehen. */
  K.melde({ bereich: 'bibliothek', id: 'zuletzt', name: 'Zuletzt geöffnet',
    zeichen: 'history', rang: 60,
    liefern: () => {
      let letzte: any[] = [];
      try { letzte = App.kuerzlich() || []; } catch { letzte = []; }
      if (!letzte.length) return [{ id: 'keine', name: 'Noch nichts geöffnet.',
                                    tun: () => {} }];
      return letzte.map((b: any) => ({
        id: 'z-' + b.id, name: String(b.text || 'Ohne Titel'), zeichen: 'page',
        tun: () => { try { App.oeffne(b.id); } catch { /* … */ } }
      }));
    }
  });
}
