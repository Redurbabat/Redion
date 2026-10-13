/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/bibliothek.ts (npm run bauen:ts). */
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

  /** Liegt ein Vorfahr im Papierkorb? (E718) Dann ist die Seite mit ihm
   *  weg — so, wie die Seitenleiste es immer schon zeigt. Gemessen war das
   *  Gegenteil: ein weggelegter Ordner liess seine Kinder in „Alle",
   *  „Zuletzt", „Favoriten" und an der Wurzel des Ablagebaums stehen. Über
   *  Blöcke, nicht über die Sammlung einer Zeile; höchstens 50 Schritte
   *  (ein Ring darf hier nicht hängen). */
  const vorfahrWeg = (b: any): boolean => {
    let cur = b && b.parentTable !== 'collection' && b.parentId ? Store.cache.blocks[b.parentId] : null;
    for (let n = 0; cur && n < 50; n++) {
      if (cur.alive === false) return true;
      cur = cur.parentTable !== 'collection' && cur.parentId ? Store.cache.blocks[cur.parentId] : null;
    }
    return false;
  };

  /** Alle echten Seiten — ohne Systemseiten, ohne Papierkorb, ohne das,
   *  was mit einem Ordner im Papierkorb liegt. */
  const alleSeiten = (): any[] => Object.values<any>(Store.cache.blocks)
    .filter(b => b.type === 'page' && b.alive !== false && !b.system &&
      (b.parentTable === 'collection'
        ? collectionPermitted('lesen', b.parentId)
        : permitted('lesen', b.id)) && !vorfahrWeg(b));

  /** Das Symbol, das ein MENSCH gesetzt hat (E718) — nicht das, das die App
   *  beim Anlegen vergibt (📄 für Seiten, 📁 für Ordner, 🗂 für Fächer).
   *  Es ist Inhalt wie der Name und steht in der Seitenleiste ohnehin. */
  const VORGABE_SYMBOLE = new Set(['', '📄', '📁', '🗂', '🗂️']);
  const eigenesSymbol = (p: any): string => {
    const s = String(p?.icon ?? '').trim();
    return VORGABE_SYMBOLE.has(s) ? '' : [...s].slice(0, 4).join('');
  };

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

  /* ══ JE ORT EIN NAME (E725, Entscheidung a) ═════════════════════════════
     Redur, Seite 13: „ich sollte von jeder kategorie nur eine sehen". Der
     Ort stand zweimal da — als Menü hinter `.bib-ort` (die Reiter oben)
     UND als Wege-Zeile aus dem Studio-Umbau, drei der vier Ziele unter
     anderem Namen („Ablage"/„Meine Ablage", „Kürzlich
     verwendet"/„Zuletzt geöffnet"). Jetzt gibt es EINE Liste mit EINEM
     Namen je Ort — die Namen der Wege, weil Redur sie eingekreist hat.
     „Alle PDFs" ist kein eigener Bestand: der Ort „Alle" mit der Art PDF
     (so stand es schon am Weg). `zeichen` ist ein Name aus
     `Register.symbole`. Hier standen bis E725 die REITER — dieselben Orte
     mit den Namen der Reiter und Emojis; zwei Listen für eine Frage (§8).

     DIE ABLAGE IST DER ERSTE ORT UND DIE VORGABE (E380). Redur hat vier
     Fotos aus GoodNotes geschickt: dort ist „Dokumente" die ABLAGE — die
     Wurzel mit ihren Ordnern, und ein Tipp auf einen Ordner führt eine
     Ebene tiefer. Die übrigen Orte bleiben absichtlich flach: „Zuletzt
     geöffnet" und „Favoriten" sind Fragen über alles, nicht über eine
     Ebene — genau wie in GoodNotes, wo sie unten als eigene Wege stehen. */
  /* `zielRang` UND `kurz` (E748): die vier Orte, die unter dem Reiter
     „Dokumente" als Ziele stehen, in Redurs Folge („Meine Ablage · Zuletzt ·
     Favoriten · PDFs · Notizhefte"), und das kurze Wort dafür. Es ist ein
     Feld an DIESER Liste, keine zweite (§8); die übrigen Orte bleiben im
     Ortsmenü. Der Lieferant steht unten bei `ortOeffnen`. */
  const ORTE: Array<{ id: string; name: string; zeichen: string; kurz?: string; zielRang?: number }> = [
    { id: 'ablage',    name: 'Meine Ablage',     zeichen: 'archive', zielRang: 1 },
    { id: 'kuerzlich', name: 'Zuletzt geöffnet', zeichen: 'clock',   zielRang: 2, kurz: 'Zuletzt' },
    { id: 'favoriten', name: 'Favoriten',        zeichen: 'star',    zielRang: 3 },
    { id: 'pdf',       name: 'Alle PDFs',        zeichen: 'page',    zielRang: 4, kurz: 'PDFs' },
    { id: 'geteilt',   name: 'Geteilt',          zeichen: 'users' },
    { id: 'privat',    name: 'Privat',           zeichen: 'lock' },
    { id: 'schule',    name: 'Ausbildung',       zeichen: 'book' },
    { id: 'datenbank', name: 'In Datenbanken',   zeichen: 'database' },
    { id: 'alle',      name: 'Alle',             zeichen: 'grid' }
  ];
  /** Welcher Ort gerade gilt — „Alle PDFs" ist „Alle" mit der Art PDF. */
  const ortAktiv = (): string =>
    zustand.reiter === 'alle' && zustand.art === 'pdf' ? 'pdf' : zustand.reiter;

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
  /** Die drei Formen — seit E725 NUR am Formknopf, als Menü (Entscheidung
   *  b); bis dahin standen sie zusätzlich im Ortsmenü. „Als Dokumente"
   *  trägt `pages` (ein Stapel Blätter), nicht `grid`: das Raster ist das
   *  Zeichen des Orts „Alle" und zeichnet ein Tabellengitter — der Knopf
   *  sah über den Deckeln aus wie „Tabelle" (Fund der Durchsicht). */
  const FORMEN: Array<{ id: 'deckel' | 'regal' | 'liste'; name: string; zeichen: string }> = [
    { id: 'deckel', name: 'Als Dokumente',      zeichen: 'pages' },
    { id: 'regal',  name: 'Nach Heften ordnen', zeichen: 'library' },
    { id: 'liste',  name: 'Als Tabelle',        zeichen: 'menu' }
  ];
  const form = (): 'deckel' | 'regal' | 'liste' => {
    const wahl = Store.getMeta('bibForm', 'deckel');
    return wahl === 'liste' ? 'liste' : wahl === 'regal' ? 'regal' : 'deckel';
  };

  /** Wo das Regal gerade steht — null ist die Wurzel. Gemerkt über das
   *  Neuladen hinweg, wie das offene Fach des Heftregals (E282). */
  const ORDNER_SCHLUESSEL = 'bibOrdner';
  const ordnerLesen = (): string | null => {
    if (typeof Store === 'undefined' || !Store.getMeta) return null;
    const id = String(Store.getMeta(ORDNER_SCHLUESSEL, '') || '');
    if (!id) return null;
    /* EIN GELÖSCHTER ORDNER FÜHRT AN DIE WURZEL, NICHT INS NICHTS.
       Dieselbe Regel wie beim Heftregal (test276): ein gemerkter Ort, den
       es nicht mehr gibt, ist kein Ort. */
    const p = Store.getBlock(id);
    return (p && p.alive !== false) ? id : null;
  };

  /* `suche` und `sucheOffen` standen hier bis E725 — der Titelfilter der
     Regalsuche. Er war nie gespeichert (nur dieser Zustand im Speicher),
     also geht mit ihm nichts verloren; gesucht wird in der EINEN Suche. */
  type Regalzustand = {
    reiter: string; ordner: string | null; sortier: string; richtung: string;
    spalten: string[]; art: string;
  };
  let zustand: Regalzustand = { reiter: 'ablage', ordner: null,
                  sortier: 'wann', richtung: 'ab',
                  spalten: SPALTEN.map(s => s.id),
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
      wrap.innerHTML = '<div class="school-home school-empty">' + schulOrt() + '<div class="school-empty-icon">🎓</div>' +
        '<h1>Ausbildungsbereich</h1><p>Lege die additive Ausbildungsvorlage an. Sie erstellt normale Seiten und Datenbanken.</p>' +
        '<button data-school-action="install" class="prim">Ausbildung einrichten</button></div>';
      wrap.querySelector('[data-school-action="install"]')?.addEventListener('click', () => {
        if (!permitted('bearbeiten')) {
          UI.toast('Du darfst hier keinen Ausbildungsbereich anlegen.');
          return;
        }
        const page = Galerie.bauen('ausbildung'); if (page) { App.zeichneBaum(); App.oeffne(page.id); }
      });
      schulOrtBinden(wrap);
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
      '<div class="school-home">' + schulOrt() +
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
    schulOrtBinden(wrap);
  };

  /** WIE VIELE „KÜRZLICH VERWENDET" ZEIGT (E367, L116).
   *
   *  Die Decke bleibt, und sie hat einen Grund: „zuletzt verwendet" heisst
   *  „die letzten", nicht „alles, was ich je angefasst habe, nach Datum".
   *  Nachgemessen ist sie NICHT die Leistungsbremse, für die man sie halten
   *  könnte — der Reiter „Alle" zeichnet daneben 2000 Deckel ohne Decke
   *  (395 ms, linear mit rund 0,19 ms je Deckel). Sie ist eine Bedeutung,
   *  keine Bremse. Und genau deshalb muss sie sich zu erkennen geben. */
  const DECKE_KUERZLICH = 60;

  /** Hat jemand anderes Zugang zu dieser Seite? */
  const hatFreigaben = (p: any): boolean => {
    if (typeof Konten === 'undefined' || !Konten.freigabenVon) return false;
    const entries = Konten.freigabenVon(p.id) || {};
    return Array.isArray(entries) ? entries.length > 0 : Object.keys(entries).length > 0;
  };

  /** Was ein Ort AUSSER der Ablage zeigt — flach über den ganzen Bestand.
   *  Steht EINMAL da (§8): das Regal zeichnet daraus, und die Suche fragt
   *  danach (E725, `suchBereich`). Für die Ablage und „Alle" gibt es keinen
   *  Filter (`null`). */
  const reiterFilter = (reiter: string, alle: any[]): any[] | null => {
    if (reiter === 'kuerzlich') return alle.filter(p => p.zuletztGeoeffnet || p.edited);
    if (reiter === 'favoriten') return alle.filter(p => p.favorite);
    if (reiter === 'geteilt')   return alle.filter(p => hatFreigaben(p) || p.oeffentlich);
    if (reiter === 'privat')    return alle.filter(p => p.parentTable !== 'collection' && !p.bereich);
    if (reiter === 'datenbank') return alle.filter(p => p.parentTable === 'collection');
    return null;
  };

  /**
   * Die Auswahl UND ihr wahrer Umfang, in einem Zug.
   *
   * BEFUND (L116): der Kopf zeigte die Länge der GESCHNITTENEN Liste. Bei
   * 61 Dokumenten stand dort „60", bei 900 auch — eine Zahl, die aussieht
   * wie eine Antwort auf „wie viele habe ich?" und keine ist. Im Regal war
   * es noch deutlicher: „60 Seiten auf diesem Gerät". Gefunden nicht von
   * einem Prüflauf, sondern auf einem Bild nach einem ZIP-Import (§55).
   *
   * Die Decke greift NACH der Suche und VOR der Umsortierung. Beides ist
   * Absicht: vorher durchsuchte man nur die sechzig neuesten und bekam
   * „nichts gefunden" für etwas, das da ist; nachher wären es die
   * alphabetisch ersten sechzig statt der sechzig neuesten.
   */
  const auswahl = (): { liste: any[]; gesamt: number } => {
    const alle = alleSeiten();
    let liste = alle;

    /* ---- DIE ABLAGE ZEIGT EINE EBENE (E380) -----------------------------
     * Bis hierher zeigte JEDER Reiter den ganzen Bestand flach: ein Ordner
     * stand neben seinem eigenen Inhalt, und ein Unterordner zwei Ebenen
     * tiefer lag gleich daneben. Ein Ordner war damit ein Etikett, kein Ort.
     *
     * In der Ablage sind es jetzt nur die direkten Kinder des offenen
     * Ordners — und an der Wurzel die Wurzelseiten. Die übrigen Reiter
     * bleiben absichtlich flach: „Kürzlich verwendet" und „Favoriten" sind
     * Fragen über ALLES, nicht über eine Ebene.
     * -------------------------------------------------------------------- */
    if (zustand.reiter === 'ablage') {
      const ordner = zustand.ordner;
      liste = ordner
        ? alle.filter(p => p.parentId === ordner && p.parentTable !== 'collection')
        : alle.filter(p => !p.parentId && p.parentTable !== 'collection');
      /* Ordner zuerst, dann nach Namen — wie in einem Dateibrowser. Nach
         Zeit zu sortieren wäre hier falsch: eine Ablage soll an derselben
         Stelle stehen bleiben, sonst sucht man bei jedem Besuch neu. */
      liste = liste.slice().sort((a, b) => {
        const oa = artVon(a).id === 'ordner' ? 0 : 1;
        const ob = artVon(b).id === 'ordner' ? 0 : 1;
        if (oa !== ob) return oa - ob;
        return String(a.text || '').localeCompare(String(b.text || ''), 'de',
          { sensitivity: 'base', numeric: true });
      });
    }

    if (zustand.reiter === 'kuerzlich')
      liste = (reiterFilter('kuerzlich', alle) || [])
                  .sort((a, b) => zeitZahl(b.zuletztGeoeffnet || b.edited) -
                                  zeitZahl(a.zuletztGeoeffnet || a.edited));
    else if (zustand.reiter !== 'ablage') liste = reiterFilter(zustand.reiter, alle) || liste;

    const gesamt = liste.length;
    if (zustand.reiter === 'kuerzlich' && liste.length > DECKE_KUERZLICH)
      liste = liste.slice(0, DECKE_KUERZLICH);

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
    return { liste, gesamt };
  };
  /* `gefiltert()` hiess diese Funktion bis E367 und gab nur die Liste
     zurück. Sie ist umbenannt, nicht entfernt: alle drei Zeichenstellen
     brauchen jetzt BEIDE Zahlen, und ein Kurzname daneben, den niemand
     ruft, wäre genau die tote Bindung, die L86 aufgeräumt hat. */

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
    /* Ein Fach (E265, `heftArt`) ist ein Ordner, auch mit einem einzigen
       Dokument oder leer — sonst wäre ein Fach mit genau einer PDF aus
       einer ZIP (E350) hier weder Ordner noch sichtbar. */
    if (p.heftArt === 'fach' || (unterseiten.length >= 2 && unterseiten.length >= kinder.length - 1))
      return { id: 'ordner', name: unterseiten.length + (unterseiten.length === 1 ? ' Sache' : ' Sachen') };
    return { id: 'seite', name: 'Seite' };
  };

  /* ---- HINEIN UND ZURÜCK (E380) ------------------------------------- *
   * Der ganze Unterschied zu vorher: ein Tipp auf einen Ordner ÖFFNET ihn
   * nicht als Seite, sondern GEHT HINEIN — dieselbe Ansicht, eine Ebene
   * tiefer. Das ist es, was Redur an GoodNotes gezeigt hat.
   * ------------------------------------------------------------------- */

  /** Der Weg von der Wurzel bis zum offenen Ordner — für die Brotkrume. */
  const ordnerWeg = (): any[] => {
    const weg: any[] = [];
    let id = zustand.ordner;
    const gesehen = new Set<string>();
    while (id && !gesehen.has(id)) {
      gesehen.add(id);
      const p = Store.getBlock(id);
      if (!p || p.alive === false) break;
      weg.unshift(p);
      id = p.parentTable === 'collection' ? null : (p.parentId || null);
    }
    return weg;
  };

  /** In einen Ordner gehen (null = zurück an die Wurzel). */
  const geheIn = (id: string | null): void => {
    zustand.ordner = id;
    zustand.reiter = 'ablage';
    /* Der Artfilter gilt der Ebene, nicht dem Weg — wer in einen Ordner
       geht, will sehen, was darin liegt, und nicht „von dieser Art gibt es
       hier nichts". */
    zustand.art = 'alle';
    if (typeof Store !== 'undefined' && Store.setMeta)
      Store.setMeta(ORDNER_SCHLUESSEL, id || '');
    App.zeichneSeite();
  };

  /** Eine Ebene hoch. An der Wurzel tut sie nichts. */
  const geheHoch = (): void => {
    const weg = ordnerWeg();
    const oben = weg.length >= 2 ? weg[weg.length - 2] : null;
    geheIn(oben ? oben.id : null);
  };

  /* ══ WAS DIE EINE SUCHE IN DER BIBLIOTHEK DURCHSUCHT (E725) ═════════════
     Redur, Seite 13: „die sucher hier sollte es bei der ganz obe such
     integriert sein". Das Feld „Dokument suchen …" war eine ZWEITE, schwächere
     Suche — ein Titelfilter auf der offenen Ebene (E282 nannte sie selbst
     „findet nur Titel"): „Leitungsschutz" im Regalfeld fand 0 Deckel, die
     Schalensuche dieselben Dokumente nach Inhalt.

     Die Schale bekommt deshalb keinen zweiten Motor, sondern eine Frage:
     was zeigt das Regal gerade? Die Antwort bleibt hier, im Bereich (§5) —
     dieselbe Ablage, dieselben Orte, dieselbe Art wie beim Zeichnen, nur
     TIEF: im Ordner der ganze Unterbaum, nicht nur die offene Ebene.

     `null`, wenn die Bibliothek gerade nicht zu sehen ist — dann hat die
     Suche keinen Bereich „Bibliothek". */
  const liegtIn = (p: any, ordnerId: string): boolean => {
    let cur = p && p.parentTable !== 'collection' && p.parentId ? Store.cache.blocks[p.parentId] : null;
    for (let n = 0; cur && n < 50; n++) {               /* ein Ring darf hier nicht hängen */
      if (cur.id === ordnerId) return true;
      cur = cur.parentTable !== 'collection' && cur.parentId ? Store.cache.blocks[cur.parentId] : null;
    }
    return false;
  };
  const suchBereich = (): { name: string; ordnerId: string | null; art: string;
                            passt: (seite: any) => boolean } | null => {
    const wurzel = document.querySelector<HTMLElement>('[data-bib-bereich]');
    if (!wurzel || !wurzel.isConnected) return null;
    const alle = alleSeiten();
    const ordnerId = zustand.reiter === 'ablage' ? zustand.ordner : null;
    const ordner = ordnerId ? Store.getBlock(ordnerId) : null;
    let liste = ordner ? alle.filter(p => liegtIn(p, ordner.id)) : (reiterFilter(zustand.reiter, alle) || alle);
    const ort = ortAktiv();
    const artFilter = ort === 'pdf' ? 'pdf' : zustand.art;
    if (artFilter !== 'alle') liste = liste.filter(p => artVon(p).id === artFilter);
    const ids = new Set(liste.map(p => String(p.id)));
    /* DER NAME SAGT, WO GESUCHT WIRD: „Bibliothek" für alles, sonst der
       Ordner, der Ort und die Art — „In ‚Kabelkunde‘", „In ‚Favoriten‘". */
    const teile: string[] = [];
    if (ordner) teile.push(String(ordner.text || 'Ohne Titel'));
    else if (ort !== 'ablage' && ort !== 'alle') teile.push(ORTE.find(o => o.id === ort)?.name || ort);
    if (ort !== 'pdf' && zustand.art !== 'alle')
      teile.push(ART_FILTER.find(a => a.id === zustand.art)?.name || zustand.art);
    return {
      name: teile.length ? 'In ‚' + teile.join(' · ') + '‘' : 'Bibliothek',
      ordnerId: ordner ? String(ordner.id) : null,
      art: artFilter,
      passt: (seite: any): boolean => !!seite && ids.has(String(seite.id))
    };
  };

  /* ---- BLICK HINEIN (E459) -------------------------------------------- *
   * Hineingehen und wieder heraus sind zwei Wege für eine Auskunft. Die
   * Ordnerkarte (`schale/bedienung/ordnerkarte.ts`) zeigt dieselben Kinder
   * an Ort und Stelle — und ihre Suche geht durch den GANZEN Unterbaum,
   * während die Suche des Regals nur die offene Ebene filtert.
   * --------------------------------------------------------------------- */

  /** Die Kindseiten eines Ordners, Ordner zuerst — wie im Regal (§8). */
  const fachSeiten = (elternId: string): any[] =>
    (Store.childrenOf(elternId) || [])
      .filter((b: any) => b && b.alive !== false && b.type === 'page')
      .sort((a: any, b: any) => {
        const ao = artVon(a).id === 'ordner' ? 0 : 1;
        const bo = artVon(b).id === 'ordner' ? 0 : 1;
        return ao !== bo ? ao - bo
          : String(a.text || '').localeCompare(String(b.text || ''), 'de');
      });

  const fachStueck = (p: any, weg: string[]): FachStueck => {
    const art = artVon(p);
    return {
      id: p.id, name: p.text || 'Ohne Titel', art: art.name,
      ordner: art.id === 'ordner',
      /* `exactOptionalPropertyTypes` verbietet `weg: undefined` — also gar
         nicht setzen, wenn der Treffer auf Ebene 1 liegt. */
      ...(weg.length ? { weg: weg.join(' \u203a ') } : {})
    };
  };

  /** Der ganze Unterbaum, flach, jeder Treffer mit seinem Weg. */
  const fachTiefe = (elternId: string, weg: string[] = [], tief = 0): FachStueck[] => {
    if (tief > 6) return [];
    const raus: FachStueck[] = [];
    for (const p of fachSeiten(elternId)) {
      raus.push(fachStueck(p, weg));
      if (artVon(p).id === 'ordner')
        raus.push(...fachTiefe(p.id, weg.concat(p.text || 'Ohne Titel'), tief + 1));
    }
    return raus;
  };

  /* ══ DER BLICK KOMMT BEIM HINSCHAUEN (E508) ═══════════════════════════════
   * Redur, 8. September: „Könntest du nicht, wenn ich klicke, das kommen,
   * sondern wenn ich mit Maus drauf gehe?"
   *
   * Ja — aber NICHT statt des Klicks. §37 nennt das Telefon den Normalfall,
   * und dort gibt es kein Überfahren; eine Karte, die nur mit der Maus
   * aufgeht, wäre auf dem Gerät, an dem Redur am meisten arbeitet, gar
   * nicht zu bekommen. Also beides, und die zwei Wege unterscheiden sich
   * in EINEM Punkt: eine erzeigte Karte geht wieder zu, wenn der Zeiger
   * fortgeht; eine ANGETIPPTE bleibt, bis man sie schliesst. Wer tippt,
   * will halten.
   *
   * DIE WARTEZEIT IST DER GANZE UNTERSCHIED zwischen „hilfreich" und
   * „springt mich an". Wer mit der Maus quer über das Regal fährt, berührt
   * fünf Ordner in einer halben Sekunde; ohne Wartezeit klappten fünf
   * Karten hinter ihm auf. 280 ms ist länger als ein Vorbeifahren und
   * kürzer als eine Absicht.
   *
   * DIE ZEIT BEIM FORTGEHEN ist kürzer, aber nicht null: der Weg vom Knopf
   * in die Karte führt für einen Augenblick über nichts von beidem, und
   * eine Karte, die in diesem Augenblick verschwindet, ist nicht zu
   * benutzen.
   * ---------------------------------------------------------------------- */
  const SCHAU_AUF_MS = 280;
  const SCHAU_ZU_MS = 220;
  let schauUhr = 0;
  let schauZuUhr = 0;
  /** Der Ordner, dessen Karte gerade per Zeigen offen ist. Leer = keine. */
  let schauId = '';
  /* IHR EIGENER SCHLIESSWEG, nicht `lage.remove()`. Die Karte hängt zwei
     Horcher an das Dokument (Escape und der Klick daneben) und gibt den
     Fokus zurück; wer nur den Knoten entfernt, lässt beides liegen — und
     nach fünf Ordnern horchen fünf tote Karten auf jede Taste. */
  let schauZu: (() => void) | null = null;

  const schauAbsagen = (): void => {
    if (schauUhr) { clearTimeout(schauUhr); schauUhr = 0; }
    if (schauZuUhr) { clearTimeout(schauZuUhr); schauZuUhr = 0; }
  };

  /** Gibt es an diesem Gerät überhaupt ein Überfahren? */
  /** Kann dieses GERÄT überfahren — mit irgendeinem seiner Eingabemittel?
   *
   *  BIS E615 STAND HIER `(hover: hover) and (pointer: fine)`, und das ist
   *  die falsche Frage. Sie beschreibt den HAUPTZEIGER: auf einem Laptop
   *  mit Berührungsbildschirm ist das der Finger, und die Abfrage antwortet
   *  dort „kein Überfahren" — obwohl eine Maus danebenliegt und ein Stift
   *  über dem Glas schwebt.
   *
   *  `any-hover` und `any-pointer` fragen nach ALLEN Eingabemitteln. Das
   *  ist die Frage, die hier gemeint war (L180). */
  const zeigerHatHover = (): boolean => {
    try { return matchMedia('(any-hover: hover) and (any-pointer: fine)').matches; }
    catch { return false; }
  };

  /** Die Karte über dem Deckel aufschlagen. `r` ist das Rechteck des Deckels.
   *  `perZeigen` heisst: sie geht wieder zu, sobald der Zeiger fortgeht. */
  const blickHinein = (p: any, r: DOMRect, perZeigen = false,
                       beiOeffnen?: (id: string) => void): void => {
    /* WOHIN „ÖFFNEN" FÜHRT, entscheidet der Aufrufer (E611). `geheIn` ist
       ein Schritt IN DER BIBLIOTHEK; die Notizhefte reichen ihr eigenes
       `openFach` herein, sonst spränge ein Fach aus dem Regal heraus. */
    const oeffne = beiOeffnen || ((id: string): void => geheIn(id));
    if (typeof Ordnerkarte === 'undefined') { oeffne(p.id); return; }
    document.querySelectorAll('.ru-fach-lage').forEach(a => a.remove());
    const zurueck = document.activeElement as HTMLElement | null;
    const lage = document.createElement('div');
    lage.className = 'ru-fach-lage';
    let zu = (): void => {};
    const griff = Ordnerkarte.bauen({
      name: p.text || 'Ohne Titel',
      kinder: fachSeiten(p.id).map(k => fachStueck(k, [])),
      tiefe: fachTiefe(p.id),
      beiWahl: (stueck: FachStueck) => {
        zu();
        if (stueck.ordner) oeffne(stueck.id); else App.oeffne(stueck.id);
      },
      beiOrdner: () => { zu(); oeffne(p.id); }
    });
    lage.append(griff.element);
    document.body.append(lage);
    /* ERST MESSEN, DANN STELLEN. Die Karte ist zugeklappt schmaler als
       aufgeklappt; gestellt wird nach dem, was wirklich dasteht. */
    const b = lage.getBoundingClientRect();
    lage.style.left = Math.max(8, Math.min(r.left, innerWidth - b.width - 8)) + 'px';
    lage.style.top = (r.bottom + 6 + b.height > innerHeight
      ? Math.max(8, r.top - b.height - 6) : r.bottom + 6) + 'px';
    const beiTaste = (ereignis: KeyboardEvent): void => {
      if (ereignis.key === 'Escape') { ereignis.stopPropagation(); zu(); }
    };
    const beiKlick = (ereignis: MouseEvent): void => {
      if (!(ereignis.target instanceof Node) || !lage.contains(ereignis.target)) zu();
    };
    zu = () => {
      document.removeEventListener('keydown', beiTaste, true);
      document.removeEventListener('mousedown', beiKlick);
      schauAbsagen();
      schauId = ''; schauZu = null;
      lage.remove();
      /* Den Fokus nur zurückgeben, wenn er auch genommen wurde. Eine Karte,
         die vom blossen Hinschauen kam, hat ihn nie gehabt. */
      if (!perZeigen) zurueck?.focus?.();
    };
    /* ── DIE KARTE HÄLT SICH SELBST, SOLANGE MAN AUF IHR LIEGT (E508) ────
       Sie hängt in einer eigenen Lage neben dem Knopf, nicht in ihm. Der
       Weg mit der Maus führt also aus dem Knopf HERAUS und in die Karte
       HINEIN — und dazwischen liegt für einen Augenblick nichts von
       beidem. Deshalb horchen beide, und das Zuklappen wird jedes Mal neu
       abgesagt, wenn der Zeiger irgendwo landet, wo er hingehört. */
    if (perZeigen) {
      schauId = String(p.id);
      schauZu = () => zu();
      lage.addEventListener('pointerenter', () => {
        if (schauZuUhr) { clearTimeout(schauZuUhr); schauZuUhr = 0; }
      });
      lage.addEventListener('pointerleave', ereignis => {
        if ((ereignis as PointerEvent).pointerType === 'touch') return;
        schauZuSpaeter();
      });
    }
    document.addEventListener('keydown', beiTaste, true);
    /* Erst im nächsten Zug horchen: der Klick, der die Karte öffnet, würde
       sie sonst im selben Zug wieder schliessen. */
    setTimeout(() => document.addEventListener('mousedown', beiKlick), 0);
    griff.klappen(true);
    /* NUR BEIM TIPPEN DEN FOKUS NEHMEN. Wer bloss hinschaut, hat den Fokus
       womöglich in der Suche des Regals — ihn wegzuziehen, weil die Maus
       über einen Ordner fuhr, wäre ein Diebstahl (§38). */
    if (!perZeigen) griff.element.querySelector<HTMLElement>('.ru-fach-griff')?.focus();
  };

  /* ═══ DAS AUGE ALS DIENST DES BEREICHS (E611) ══════════════════════════
     Redur, 16. September: „das ist nur bei Bibliothek — ich will überall,
     wenn ein Ordner erstellt wird, das haben."

     Es gibt genau ZWEI Stellen, die eine Ordner-Kachel zeichnen: hier und
     `fachCard` in `notebook.ts`. Damit die zweite dasselbe bekommt und
     nicht etwas Ähnliches, stehen Auszeichnung UND Verdrahtung ab jetzt
     an EINER Stelle und werden nach aussen gegeben. Beide Dateien liegen
     im Bereich `wissen` — §5 Regel 1 erlaubt eigene Dateien untereinander.

     Zwei Kopien wären der sicherere Weg gewesen, aber der falsche: die
     zweite wäre beim nächsten Bogen am Auge stehengeblieben, und dann
     hätte Redion zwei Augen, die sich verschieden benehmen. */

  /** Das Auge selbst. EINE Quelle für die Auszeichnung. */
  const blickKnopf = (id: string, name: string): string =>
    `<button class="bib-blick" data-blick="${esc(id)}" ` +
      `aria-label="Blick in „${esc(name || 'Ohne Titel')}“" title="Blick hinein">` +
      '<i class="bib-blick-auge" aria-hidden="true"><b></b></i></button>';

  /** Das „…" einer Karte (E721): ein echter Knopf, benannt nach dem Ding,
   *  44 × 44 zu treffen, 26 px zu sehen. Er gehört zur Zelle, nicht in den
   *  Deckel — dieselbe Regel wie beim Auge. Der Klassenname bleibt der des
   *  alten ⌄ (test432, test560 drücken ihn). */
  const mehrKnopf = (id: string, name: string): string =>
    `<button type="button" class="bib-deckel-mehr" data-mehr-id="${esc(id)}" aria-haspopup="menu" ` +
      `aria-label="Aktionen für „${esc(name || 'Ohne Titel')}“" title="Aktionen">` +
      '<i aria-hidden="true">\u22ef</i></button>';

  /** Deckel und Auge in einer Zelle. Das Auge ist ein GESCHWISTER des
   *  Deckels, kein Kind: ein Knopf im Knopf ist kein gültiges HTML, und
   *  der Klick käme zweimal an (E463). */
  const mitBlick = (deckelHtml: string, id: string, name: string): string =>
    '<span class="bib-zelle">' + deckelHtml + blickKnopf(id, name) + '</span>';

  /** Die Augen in `wurzel` verdrahten — derselbe Weg wie im ⌄-Menü, ohne
   *  Menü. Seit E508 öffnet auch das blosse HINSCHAUEN.
   *
   *  `beiOeffnen` sagt, was „Ordner öffnen" tun soll. Ohne Angabe ist das
   *  `geheIn`, also ein Schritt IN DER BIBLIOTHEK. Für die Notizhefte wäre
   *  das falsch — dort führt es aus dem Regal heraus; sie reichen deshalb
   *  ihr eigenes `openFach` herein. `test531` §2 hält genau das fest. */
  const blickAnbringen = (wurzel: ParentNode, beiOeffnen?: (id: string) => void): void => {
    wurzel.querySelectorAll<HTMLElement>('.bib-blick[data-blick]').forEach(b => {
      const seiteVon = (): any => Store.getBlock(b.dataset['blick'] || '');
      b.addEventListener('click', ereignis => {
        ereignis.stopPropagation();
        schauAbsagen();
        const p = seiteVon();
        /* Ein Tipp auf denselben Ordner, dessen Karte gerade vom Zeigen
           offen steht, klappt sie nicht zu und wieder auf — er HÄLT sie
           fest. Alles andere wäre ein Flackern für nichts. */
        if (p && schauId === String(p.id) && document.querySelector('.ru-fach-lage')) {
          schauId = '';
          return;
        }
        if (p) blickHinein(p, b.getBoundingClientRect(), false, beiOeffnen);
      });
      b.addEventListener('pointerenter', ereignis => {
        const e = ereignis as PointerEvent;
        /* MAUS ODER STIFT (E615, L180). Ein Stift, der über dem Glas
           schwebt, IST ein Überfahren — Surface, iPad mit Tastatur, Wacom.
           Bis hierher stand `!== 'mouse'`, und damit war er zusammen mit
           dem Finger ausgesperrt; Redur hat es am 16. September gemeldet.

           DER FINGER BLEIBT DRAUSSEN, und zwar mit Grund: er meldet auf
           manchen Geräten ein `pointerenter`, das kein Überfahren ist,
           sondern der Anfang eines Tippens. `test476 §6` hält das fest. */
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        if (!zeigerHatHover()) return;
        if (document.querySelector('.ru-fach-lage')) return;
        schauAbsagen();
        schauUhr = window.setTimeout(() => {
          schauUhr = 0;
          const p = seiteVon();
          if (p) blickHinein(p, b.getBoundingClientRect(), true, beiOeffnen);
        }, SCHAU_AUF_MS);
      });
      /* EIN TIPP IST KEIN HINSCHAUEN (E615, L180).
         Beim Antippen kommt erst `pointerenter`, dann `pointerdown` — und
         dazwischen sagte nichts ab. Die Uhr lief weiter, und die Karte ging
         nach dem Tippen von selbst auf. Am Auge fiel das kaum auf, weil ein
         Klick sie ohnehin öffnet; überall dort, wo Tippen und Hinschauen
         Verschiedenes bedeuten, wäre es ein Fehler. */
      b.addEventListener('pointerdown', () => {
        if (schauUhr) { clearTimeout(schauUhr); schauUhr = 0; }
      });
      b.addEventListener('pointerleave', ereignis => {
        if ((ereignis as PointerEvent).pointerType === 'touch') return;
        /* Noch nicht aufgegangen: die Absicht war keine. Schon offen: die
           Karte selbst entscheidet, ob der Zeiger zu ihr gewandert ist. */
        if (schauUhr) { clearTimeout(schauUhr); schauUhr = 0; }
        if (schauId) schauZuSpaeter();
      });
    });
  };

  /** Nach einer kurzen Frist zuklappen — jeder neue Zeigerkontakt sagt ab. */
  const schauZuSpaeter = (): void => {
    if (schauZuUhr) clearTimeout(schauZuUhr);
    schauZuUhr = window.setTimeout(() => {
      schauZuUhr = 0;
      if (!schauId) return;
      const zu = schauZu;
      schauId = ''; schauZu = null;
      if (zu) zu(); else document.querySelectorAll('.ru-fach-lage').forEach(a => a.remove());
    }, SCHAU_ZU_MS);
  };

  /** Die Brotkrume der Ablage. An der Wurzel schweigt sie — ein Pfad mit
   *  genau einem Glied ist kein Pfad, sondern eine Zeile Luft. */
  const ordnerKrume = (): string => {
    const weg = ordnerWeg();
    if (!weg.length) return '';
    return '<nav class="bib-krume" aria-label="Wo ich bin">' +
      '<button data-hoch aria-label="Eine Ebene zurück">\u2039</button>' +
      '<button data-ordner="">Dokumente</button>' +
      weg.map((p, i) => '<span aria-hidden="true">\u203a</span>' +
        (i === weg.length - 1
          ? '<b>' + esc(p.text || 'Ohne Titel') + '</b>'
          : `<button data-ordner="${esc(p.id)}">` + esc(p.text || 'Ohne Titel') + '</button>')
      ).join('') +
      '</nav>';
  };

  /** Die Filterzeile über dem Regal — sie filtert nach ART, nicht nach Ort. */
  const ART_FILTER: { id: string; name: string }[] = [
    { id: 'alle',   name: 'Alle' },
    { id: 'pdf',    name: 'PDF' },
    { id: 'board',  name: 'Whiteboards' },
    { id: 'plan',   name: 'Schaltpläne' },
    { id: 'blatt',  name: 'Blätter' },
    { id: 'tab',    name: 'Tabellen' },
    { id: 'db',     name: 'Datenbanken' },
    { id: 'karten', name: 'Karteikarten' },
    { id: 'ordner', name: 'Ordner' },
    { id: 'datei',  name: 'Dateien' },
    { id: 'seite',  name: 'Seiten' }
  ];

  /* DIE WEGE-ZEILE (`studioNavigation`) STAND HIER BIS E725: „Meine Ablage ·
     Zuletzt geöffnet · Favoriten · Alle PDFs", dahinter „Sammlungen ⌄" als
     `<details><select>` und das Feld „Dokument suchen …". Redur hat sie grün
     umkreist und das Feld rot durchgestrichen: „ich sollte von jeder
     kategorie nur eine sehen und die anderen alles unterdem das beim ^".
     Die vier Wege und die sechs Sammlungen stehen seither im Ortsmenü
     (`ortMenue`, je ein Name), gesucht wird in der EINEN Suche (E725). */

  /** Bis zu drei wirklich geöffnete Dokumente — und ohne sie NICHTS.
   *  Hier standen bis E725 zwei Attrappen, „Neue Seite" und „PDF öffnen":
   *  dieselben Knöpfe stehen im Kopf darüber, drei Zeilen höher — am
   *  Telefon schoben sie den ersten Deckel aus dem ersten Bild. */
  const recentCarousel = (): string => {
    if (zustand.ordner || zustand.art !== 'alle' ||
      !['ablage', 'kuerzlich'].includes(zustand.reiter)) return '';
    const recent = alleSeiten().filter(p => p.zuletztGeoeffnet)
      .sort((a, b) => zeitZahl(b.zuletztGeoeffnet) - zeitZahl(a.zuletztGeoeffnet)).slice(0, 3);
    if (!recent.length) return '';
    return '<section class="rmo-recent" aria-label="Zuletzt geöffnet"><h2>Zuletzt geöffnet</h2>' +
      '<div class="rmo-recent-track">' + recent.map((p, index) =>
        '<button type="button" class="rmo-recent-card" data-rmo-open="' + esc(p.id) +
        '" style="--rmo-index:' + index + '"><span>' + esc(artVon(p).name) + '</span><b>' +
        esc(p.text || 'Ohne Titel') + '</b><small>' + esc(wannText(p.zuletztGeoeffnet)) +
        '</small></button>').join('') +
      '</div></section>';
  };

  /** Nur ein wirklich geöffnetes PDF anbieten; Importzeit ist kein Lesefortschritt. */
  const studioWeiter = (): string => {
    if (zustand.reiter !== 'ablage' || zustand.ordner || zustand.art !== 'alle') return '';
    const letzte = alleSeiten().filter(p => p.zuletztGeoeffnet && artVon(p).id === 'pdf')
      .sort((a, b) => zeitZahl(b.zuletztGeoeffnet) - zeitZahl(a.zuletztGeoeffnet))[0];
    if (!letzte) return '';
    const bild = typeof Vorschau !== 'undefined' && Vorschau.bildDatei ? Vorschau.bildDatei(letzte.id) : null;
    return '<section class="bib-studio-weiter" aria-label="PDF weiterlesen">' +
      '<span class="bib-studio-miniatur" aria-hidden="true">' +
        (bild ? '<img data-vorschau="' + esc(bild) + '" alt="" loading="lazy">' : '<span>PDF</span>') + '</span>' +
      '<div><span class="bib-studio-eyebrow">Weiterarbeiten</span><h2>' + esc(letzte.text || 'Ohne Titel') +
        '</h2><p>Zuletzt geöffnet ' + esc(wannText(letzte.zuletztGeoeffnet)) + '</p></div>' +
      /* „WEITERLESEN", NICHT „PDF ÖFFNEN" (E516, L139). Hier stand ein
         Jahr lang dasselbe Wort wie am Importeur, und dieser Knopf macht
         das GEGENTEIL: er holt die zuletzt geöffnete PDF zurück. Redur
         hat es als Fehler gemeldet — „wenn ich oben eine neue PDF einfügen
         will, kopiert es immer die aktuelle PDF" —, und drei gemessene
         Importwege waren sauber, weil der Import nie kaputt war. Kaputt
         war das Wort. */
      '<button type="button" data-studio-weiter="' + esc(letzte.id) + '">Weiterlesen' +
        '<span aria-hidden="true">↗</span></button></section>';
  };

  /* DAS WORT DES IMPORTKNOPFES steht EINMAL da (§8). Es steht auch in
     `index.html` am Kopfknopf; `test482 §4` hält beide zusammen. */
  const IMPORT_WORT = 'PDF öffnen';
  /**
   * Den Importknopf beschriften, ohne ihm sein Zeichen wegzunehmen.
   *
   * VORHER STAND HIER `button.textContent = …`, und das ist genau die
   * Zeile, die seit E515 wehtut: `textContent` wirft die KINDKNOTEN weg,
   * und dort hängt seit E515 das gezeichnete Zeichen. Nach dem ersten
   * Import stand der Knopf ohne Zeichen da — für den Rest der Sitzung, und
   * kein Neuladen der Bibliothek holte es zurück, weil der Kopfknopf in
   * `index.html` steht und nicht neu gezeichnet wird.
   *
   * Der zweite Fehler in derselben Zeile war der Name: der Knopf hiess
   * danach „PDF importieren" statt „PDF öffnen". Ein Knopf, der seinen
   * Namen wechselt, weil man ihn einmal gedrückt hat, ist ein anderer Knopf.
   */
  const importBeschriften = (wort?: string): void => {
    document.querySelectorAll<HTMLButtonElement>('[data-studio-import]').forEach(knopf => {
      const feld = knopf.querySelector<HTMLElement>('.wort')
        || knopf.querySelector<HTMLElement>('span:not([data-sym]):not([aria-hidden="true"])');
      if (feld) feld.textContent = wort || IMPORT_WORT;
      else knopf.textContent = wort || IMPORT_WORT;
    });
  };
  let pdfImportLaeuft = false;
  /** Derselbe PDF-Importer wie beim Archivimport, mit direktem Weg ins Dokument. */
  const pdfImportieren = (): void => {
    const ziel = zustand.reiter === 'ablage' ? zustand.ordner : null;
    if (pdfImportLaeuft) return;
    if (!permitted('bearbeiten', ziel || undefined)) {
      UI.toast('Du darfst hier keine PDF ablegen.'); return;
    }
    if (typeof ArchivImport === 'undefined' || !ArchivImport.dateiAlsDokument) {
      UI.toast('Der PDF-Import ist gerade nicht verfügbar.'); return;
    }
    const eingabe = document.createElement('input');
    eingabe.type = 'file'; eingabe.accept = '.pdf,application/pdf';
    eingabe.hidden = true;
    document.body.appendChild(eingabe);
    eingabe.addEventListener('cancel', () => eingabe.remove(), { once: true });
    eingabe.addEventListener('change', async () => {
      const datei = eingabe.files?.[0];
      eingabe.remove();
      if (!datei || pdfImportLaeuft) return;
      if (!/\.pdf$/i.test(datei.name)) { UI.toast('Bitte eine PDF-Datei auswählen.'); return; }
      if (!permitted('bearbeiten', ziel || undefined) || (ziel && Store.getBlock(ziel)?.alive === false)) {
        UI.toast('In diesem Ordner kann nichts abgelegt werden.'); return;
      }
      pdfImportLaeuft = true;
      document.querySelectorAll<HTMLButtonElement>('[data-studio-import]').forEach(button => {
        button.disabled = true; button.setAttribute('aria-busy', 'true');
      });
      importBeschriften('PDF wird gelesen …');
      try {
        const ergebnis = await ArchivImport.dateiAlsDokument(datei, ziel);
        App.zeichneBaum();
        if (ergebnis.seiteId) App.oeffne(ergebnis.seiteId);
        else App.zeichneSeite();
      } catch (fehler: unknown) {
        UI.toast('PDF konnte nicht importiert werden: ' +
          (fehler instanceof Error ? fehler.message : String(fehler)));
      } finally {
        pdfImportLaeuft = false;
        document.querySelectorAll<HTMLButtonElement>('[data-studio-import]').forEach(button => {
          button.disabled = !permitted('bearbeiten', zustand.ordner || undefined);
          button.removeAttribute('aria-busy');
        });
        importBeschriften();
      }
    }, { once: true });
    eingabe.click();
  };

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
    const children = art.id === 'ordner' ? alleSeiten().filter(child =>
      child.parentId === p.id && child.parentTable !== 'collection') : [];
    const folderPreview = art.id === 'ordner' ? '<span class="rmo-folder-preview">' +
      '<b>' + children.length + (children.length === 1 ? ' Unterseite' : ' Unterseiten') + '</b>' +
      children.slice(0, 3).map(child => '<span>' + esc(child.text || 'Ohne Titel') + '</span>').join('') +
      '</span>' : '';
    /* DAS ECHTE BILD GEHT VOR (L61, E313). Eine eingelesene PDF-Seite und
       ein Bildblock tragen ihre Datei bei sich; die zeigt der Deckel, statt
       eine weisse Fläche mit dem Wort „PDF" darauf. Erst wenn es keine
       gibt, kommt die Textvorschau — und die nur bei den Arten, bei denen
       im Text etwas steht. */
    const datei = Vorschau.bildDatei ? Vorschau.bildDatei(p.id) : null;
    /* UND WENN ES KEINE DATEI GIBT, ABER HANDSCHRIFT (E374, L61 Rest).
       Ein A4-Blatt, auf das nur geschrieben wurde, hat keine Datei — sein
       Deckel stand bis heute weiss da, und in einem Regal handgeschriebener
       Hefte waren das alle. Die Striche liegen im Block; sie zu zeichnen
       kostet keine Datei und kann nicht veralten. */
    const tinte = !datei && Vorschau.tinteSvg ? Vorschau.tinteSvg(p.id) : '';
    const bild = datei
      ? `<img class="bib-deckel-bild" data-vorschau="${esc(datei)}" alt="" loading="lazy">`
      : (tinte || (MIT_TEXT.has(art.id) ? (Vorschau.miniatur(p.id, 5) || '') : ''));
    const wann = wannText(p.zuletztGeoeffnet || p.edited || p.created);
    const deckel = `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="${esc(art.id)}"` +
      /* DIE FARBE DES ORDNERS (E672) — dieselbe Marke wie beim Heft und
         beim Fach; das Stilblatt kennt eine Regel für alle drei. */
      Farben.marke(p.color) + ' ' +
      `title="${esc(p.text || 'Ohne Titel')}">` +
      `<span class="bib-deckel-blatt mini-zeilen${bild ? '' : ' is-leer'}${tinte ? ' hat-tinte' : ''}">` +
        '<i class="bib-papier" aria-hidden="true"></i>' +
        (bild || '') + folderPreview +
        /* Die Marke bleibt: sie sagt, WAS es ist, und das sagt ein Bild
           der ersten Seite nicht. Sie sitzt in der Ecke, nicht davor. */
        (art.id === 'pdf' ? '<i class="bib-deckel-marke">PDF</i>' : '') +
        `<i class="bib-deckel-stern${p.favorite ? ' an' : ''}" aria-hidden="true">` +
          (p.favorite ? '\u2605' : '\u2606') + '</i>' +
      '</span>' +
      '<span class="bib-deckel-name">' +
        (eigenesSymbol(p) ? '<i class="bib-deckel-symbol" aria-hidden="true">' + esc(eigenesSymbol(p)) + '</i>' : '') +
        '<b>' + esc(p.text || 'Ohne Titel') + '</b></span>' +
      '<small>' + esc(art.name) + ' \u00b7 ' + esc(wann) + '</small>' +
      '</button>';
    /* DAS AUGE AM ORDNER (E463). „Blick hinein" stand seit E459 nur im
       ⌄-Menü — ein Weg, den man kennen muss. Jetzt sitzt am Deckel jedes
       Ordners ein Auge, das beim Darüberfahren zwinkert und zur Seite
       schaut. Auszeichnung und Verdrahtung stehen seit E611 in `blickKnopf`
       und `blickAnbringen`, damit die Notizhefte DASSELBE Auge bekommen
       und nicht ein ähnliches.

       DAS „…" OBEN RECHTS (E721). Redur hat auf S. 19 des Masterprompts den
       ☆ oben rechts eingekreist: „Hier füge ...". Bis hier war das Menü ein
       ⌄ von 20 × 20 IM Kartenknopf — `aria-hidden`, weil ein Knopf in einem
       Knopf kein gültiges HTML ist, und damit für Tastatur und Vorleser gar
       nicht da. Jetzt ist es ein eigener Knopf NEBEN dem Deckel, in derselben
       Zelle wie das Auge — an der Stelle und in der Art des ⋯ der Notizhefte.
       JEDE Karte bekommt die Zelle, nicht nur der Ordner. */
    return '<span class="bib-zelle">' + deckel +
      (art.id === 'ordner' ? blickKnopf(p.id, p.text) : '') +
      mehrKnopf(p.id, p.text) + '</span>';
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
  /** „n von m" statt „n", solange die Decke greift (E367, L116). Ohne
   *  Decke bleibt der Satz Wort für Wort, wie er war. */
  const umfangSatz = (gezeigt: number, gesamt: number,
                      eins: string, mehr: string, vonForm: string): string =>
    /* `vonForm` ist der DATIV: „60 von 313 Dokumenten", nicht „Dokumente".
       Der erste Wurf nahm die Mehrzahl für beide Fälle, und der Fehler stand
       auf dem Bild, nicht im Prüflauf (§55). Bei „Seiten" fällt es nicht
       auf — deshalb steht es hier als eigenes Wort und nicht als Regel. */
    gesamt > gezeigt
      ? gezeigt + ' von ' + gesamt + ' ' + vonForm
      : gezeigt + ' ' + (gezeigt === 1 ? eins : mehr);

  const bibKopf = (liste: any[], alle: any[], gesamt = liste.length): string => {
    /* Auch die Listenform ist in der Ablage ein Ordner-Browser (E382). Bis
       E382 hatte sie keine Brotkrume: man ging in ein Fach hinein (per
       Zeilenklick) und sah danach weder, WO man war, noch einen Weg zurück —
       der Titel stand fest auf „Bibliothek". Jetzt trägt der Kopf in der
       Ablage denselben Pfad wie die Deckelansicht (E380). */
    // One header in every saved presentation, including older notebook shelves.
    return deckelKopf(alle, liste.length, zustand.art === 'alle' ? gesamt : liste.length);
  };

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

    return '<details class="bib-pflege-details"><summary><span class="rmo-product-status" data-zustand="' +
      (st.stufe === 'gut' ? 'fertig' : 'wartet') + '">' + esc(satz) + '</span>' +
      '<span>Sicherung & Speicher</span></summary>' +
      '<section class="bib-abschnitt"><header><h2>Sicherung und Papierkorb</h2>' +
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
      '</div></section>' + platzKarte() + '</details>';
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

  /* ====================================================================== *
   * ECHTE BIBLIOTHEKS-BAUMANSICHT
   * ---------------------------------------------------------------------- *
   * Kein Beispieldatensatz und keine zweite Ablage. Der Baum wird bei jedem
   * Zeichnen direkt aus den vorhandenen page-Blöcken im Store aufgebaut.
   * Klick auf einen Ordner geht in genau denselben Ordner wie die Deckel-
   * ansicht; Klick auf eine normale Seite öffnet genau diese Seite.
   *
   * DIE ZEICHEN KOMMEN AUS `Register.symbole`, nicht aus Kästchen-Glyphen.
   * Hier standen einmal `□`, `▣` und `▤` — und zwar doppelt kodiert, weil
   * die Datei auf dem Laptop einmal als Latin-1 gelesen wurde. Ein
   * Strichzeichen aus dem Register sieht auf jedem System gleich aus (E202)
   * und kann gar nicht erst falsch kodiert werden.
   * ====================================================================== */

  type BibBaumKnoten = {
    id: string;
    name: string;
    zeichen?: string;
    farbe?: string;
    kinder?: BibBaumKnoten[];
  };

  const BIB_BAUM_WURZEL = '__redion_bibliothek_wurzel__';
  const BIB_BAUM_OFFEN = 'bibBaumOffen';

  const bibliothekBaumKnoten = (): BibBaumKnoten[] => {
    const seiten = alleSeiten()
      .filter(p => p.parentTable !== 'collection');

    const nachId = new Map<string, any>();
    seiten.forEach(p => nachId.set(String(p.id), p));

    const nachEltern = new Map<string, any[]>();
    for (const p of seiten) {
      const parent = p.parentId && nachId.has(String(p.parentId))
        ? String(p.parentId)
        : '';
      const liste = nachEltern.get(parent) || [];
      liste.push(p);
      nachEltern.set(parent, liste);
    }

    const sortiere = (a: any, b: any): number => {
      const aKinder = (nachEltern.get(String(a.id)) || []).length;
      const bKinder = (nachEltern.get(String(b.id)) || []).length;
      if (!!aKinder !== !!bKinder) return aKinder ? -1 : 1;
      return String(a.text || '').localeCompare(String(b.text || ''), 'de',
        { sensitivity: 'base', numeric: true });
    };

    const bauen = (p: any, gesehen: Set<string>): BibBaumKnoten => {
      const id = String(p.id);
      if (gesehen.has(id))
        return { id, name: String(p.text || 'Ohne Titel'), zeichen: 'page' };

      const weiter = new Set(gesehen);
      weiter.add(id);
      const kinder = (nachEltern.get(id) || [])
        .slice()
        .sort(sortiere)
        .map(k => bauen(k, weiter));

      const farbe = Farben.kennung(p.color);
      return {
        id,
        name: String(p.text || 'Ohne Titel'),
        /* Ein eigenes Symbol (E718) geht vor dem Strich: es ist Inhalt.
           Die Baumansicht setzt, was sie nicht im Register findet, als
           Text (`textContent`, nie als HTML — baum.ts). */
        zeichen: eigenesSymbol(p) || (kinder.length || p.heftArt === 'fach' ? 'pages' : 'page'),
        /* Die Ordnerfarbe wandert in den Baum (E672): wer einen Ordner blau
           macht, will ihn ÜBERALL blau sehen, nicht nur als Deckel. */
        ...(farbe ? { farbe } : {}),
        ...(kinder.length ? { kinder } : {})
      };
    };

    const wurzeln = (nachEltern.get('') || [])
      .slice()
      .sort(sortiere)
      .map(p => bauen(p, new Set<string>()));

    return [{
      id: BIB_BAUM_WURZEL,
      name: 'Dokumente',
      zeichen: 'library',
      kinder: wurzeln
    }];
  };

  const bibliothekBaumNachtragen = (wrap: HTMLElement): void => {
    if (zustand.reiter !== 'ablage') return;
    const stelle = wrap.querySelector<HTMLElement>('[data-bib-baum]');
    if (!stelle) return;

    const Baum = (window as any).Baumansicht;
    if (!Baum?.bauen) {
      stelle.innerHTML = '<p class="bib-baum-fehlt">Baumansicht konnte nicht geladen werden.</p>';
      return;
    }

    const gemerkt = Store.getMeta(BIB_BAUM_OFFEN, []);
    const offeneMeta = Array.isArray(gemerkt) ? gemerkt.map(String) : [];
    const pfad = ordnerWeg().map(p => String(p.id));
    const offen = [...new Set<string>([BIB_BAUM_WURZEL, ...offeneMeta, ...pfad])];

    const griff = Baum.bauen({
      name: 'Dokumente',
      knoten: bibliothekBaumKnoten(),
      gewaehlt: zustand.ordner || BIB_BAUM_WURZEL,
      offen,
      gewaehltGeaendert: (id: string) => {
        if (id === BIB_BAUM_WURZEL) {
          geheIn(null);
          return;
        }
        const p = Store.getBlock(id);
        if (!p || p.alive === false || !permitted('lesen', id)) return;
        if (artVon(p).id === 'ordner') {
          geheIn(id);
          return;
        }
        App.oeffne(id);
      },
      offenGeaendert: (ids: string[]) => {
        if (Store.setMeta) Store.setMeta(BIB_BAUM_OFFEN, ids);
      },
      /* DER ABLAGEBAUM HAT DIESELBEN AKTIONEN WIE DIE KARTE (E721) —
         Redur, S. 13: „auch die rechtsk klickt sollte hier für die ordner
         haben". Nicht für die Wurzel „Dokumente": die ist kein Ding. */
      aktionen: (id: string, wo: { anker: HTMLElement; x?: number; y?: number; tastatur: boolean }) => {
        const p = id === BIB_BAUM_WURZEL ? null : Store.getBlock(id);
        if (!p || p.alive === false) return false;
        return !!Menue.aktionen(p, ortFuer(p, wo.anker),
          wo.tastatur ? { rueckfokus: wo.anker } : { x: wo.x ?? 0, y: wo.y ?? 0, rueckfokus: wo.anker });
      },
      entf: (id: string, anker: HTMLElement) => {
        const p = id === BIB_BAUM_WURZEL ? null : Store.getBlock(id);
        return p ? Register.aktionen.taste('Entf', p, ortFuer(p, anker)) : false;
      }
    });

    stelle.replaceChildren(griff.element);
  };
  /**
   * DIE ART — EINE PILLE STATT EINER ZEILE (E725), und wann sie WEGBLEIBT.
   *
   * Bis E725 stand hier `artenZeile`: bis elf Chips in einer eigenen Bank
   * („Alle · PDF · Whiteboards · Blätter …"), von Redur grün umkreist —
   * „von jeder kategorie nur eine sehen und die anderen alles unterdem das
   * beim ^". Jetzt steht die gewählte Art als Pille in der Zeile mit Ort
   * und Form; die übrigen stehen in ihrem Menü, jede mit ihrer Zahl.
   *
   * Die Regel vom 6. September bleibt: ein Filter mit einer einzigen Wahl
   * filtert nichts — die Pille erscheint erst, wenn es zwei Arten zu
   * unterscheiden gibt; ein gesetzter Filter bleibt immer sichtbar, sonst
   * käme man aus ihm nicht mehr heraus.
   */
  const artenVon = (alle: any[]): Array<{ id: string; name: string; zahl: number }> => {
    const zahl = new Map<string, number>();
    alle.forEach(p => { const a = artVon(p).id as string; zahl.set(a, (zahl.get(a) || 0) + 1); });
    return ART_FILTER
      .filter(a => a.id === 'alle' || zahl.has(a.id) || a.id === zustand.art)
      .map(a => ({ id: a.id, name: a.id === 'alle' ? 'Alle Arten' : a.name,
                   zahl: a.id === 'alle' ? alle.length : (zahl.get(a.id) || 0) }));
  };
  const artPille = (alle: any[]): string => {
    const arten = artenVon(alle);
    if (arten.length <= 2 && zustand.art === 'alle') return '';
    const jetzt = arten.find(a => a.id === zustand.art) || arten[0];
    return '<button type="button" class="bib-pille bib-art" data-art-wahl aria-haspopup="menu" ' +
      'aria-expanded="false"' + (zustand.art !== 'alle' ? ' data-gefiltert' : '') + '>' +
      '<span class="bib-pille-wort">' + esc(jetzt ? jetzt.name : 'Alle Arten') + '</span>' +
      '<span class="bib-pille-pfeil" data-sym="chevronD" aria-hidden="true"></span></button>';
  };

  /* ---------------------------------------------------------------- *
   * DIE DECKELANSICHT (E236)
   * ---------------------------------------------------------------- */
  const zeichneDeckel = (wrap: HTMLElement): void => {
    const { liste: alle, gesamt } = auswahl();
    const liste = zustand.art === 'alle'
      ? alle : alle.filter(p => artVon(p).id === zustand.art);

    wrap.innerHTML =
      '<div class="bib bib-deckel-seite" data-bib-bereich>' +
        /* DIE ZAHL IST DIE DER GEZEIGTEN DECKEL (E725). Mit der Art als Pille
           stand sonst „Alle PDFs · 20" über zwei PDFs — die Zahl des Orts,
           nicht die des Regals. Ohne Artfilter bleibt es, wie es war. */
        deckelKopf(alle, liste.length, zustand.art === 'alle' ? gesamt : liste.length) +
        (zustand.reiter === 'ablage'
          ? '<div class="bib-ablage-layout">' +
              '<details class="bib-ablage-baum" aria-label="Ablagebaum"' +
                (Store.getMeta('bibBaumSichtbar', false) ? ' open' : '') + '>' +
                '<summary class="bib-ablage-baum-kopf">Ordner & Seiten</summary>' +
                '<div data-bib-baum></div>' +
              '</details><div class="bib-ablage-inhalt">'
          : '') +
        studioWeiter() + recentCarousel() +
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
        (zustand.reiter === 'ablage' ? '</div></div>' : '') +
        sicherungsKarte() +
      '</div>';

    if (typeof Register !== 'undefined' && Register.symbole)
      Register.symbole.fuelle(wrap);
    binde(wrap);
    bibliothekBaumNachtragen(wrap);
    platzNachtragen(wrap);
    /* Die Adressen der Vorschaubilder kommen aus der Ablage und damit
       später als die Karte (E313). */
    if (Vorschau.bilderNachtragen) Vorschau.bilderNachtragen(wrap);
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
  /** Die Ortspille (E725) — im Kopf der drei Formen und in der Schulansicht. */
  const ortPille = (name: string, zahl = '', einheit = ''): string =>
    '<button type="button" class="bib-pille bib-ort" data-orte aria-haspopup="menu" aria-expanded="false">' +
      '<span class="bib-pille-wort">' + esc(name) + '</span>' +
      (zahl ? '<span class="bib-pille-zahl">' + esc(zahl) +
        '<span class="bib-pille-einheit">' + esc(einheit) + '</span></span>' : '') +
      '<span class="bib-pille-pfeil" data-sym="chevronD" aria-hidden="true"></span></button>';
  /** „Ausbildung" ist ein Ort, kein Ende (E725): auch die Schulansicht trägt
   *  den Ort-Wähler — vorher kam man aus ihr bis zum Neuladen nicht heraus,
   *  weil `oeffne()` den Ort stehen lässt und es dort keinen Wähler gab. */
  const schulOrt = (): string =>
    '<div class="bib-wahl school-ort" role="group" aria-label="Was die Bibliothek zeigt">' +
      ortPille(ORTE.find(o => o.id === 'schule')?.name || 'Ausbildung') + '</div>';
  const schulOrtBinden = (wrap: HTMLElement): void => {
    if (typeof Register !== 'undefined' && Register.symbole) Register.symbole.fuelle(wrap);
    wrap.querySelector<HTMLElement>('[data-orte]')?.addEventListener('click', ereignis =>
      ortMenue(ereignis.currentTarget as HTMLElement));
  };
  const deckelKopf = (alle: any[], anzahl: number, gesamt = anzahl): string => {
    const ort = ORTE.find(r => r.id === ortAktiv())?.name || 'Alle';
    const satz = umfangSatz(anzahl, gesamt, 'Dokument', 'Dokumente', 'Dokumenten');
    const schnitt = satz.lastIndexOf(' ');
    const satzZahl = schnitt > 0 ? satz.slice(0, schnitt) : satz;
    const satzEinheit = schnitt > 0 ? satz.slice(schnitt) : '';
    /* DER TITEL IST DER ORDNER, IN DEM MAN STEHT (E380) — wie in GoodNotes:
       oben steht nicht die App, sondern wo man ist. An der Wurzel bleibt es
       „Dokumente". */
    const weg = zustand.reiter === 'ablage' ? ordnerWeg() : [];
    const hier = weg.length ? String(weg[weg.length - 1].text || 'Ohne Titel') : 'Dokumente';
    return '<header class="bib-dkopf">' +
      ordnerKrume() +
      '<h1>' + esc(hier) + '</h1>' +
      '<button class="bib-neu" data-neu-auf>' +
        '<b aria-hidden="true">+</b><span>Neu</span></button>' +
      /* EIN WORT FÜR EINE HANDLUNG (E516). Der Knopf im Kopf heisst „PDF
         öffnen", dieser hiess „PDF importieren" — zwei Namen für dasselbe,
         und keiner von beiden war der, den man las: sichtbar war im Regal
         nur die Karte „Weiterarbeiten", die auch „PDF öffnen" hiess.
         Jetzt tragen beide Importknöpfe dasselbe Wort und dasselbe
         gezeichnete Zeichen, und sonst niemand. */
      '<button class="bib-studio-import" data-studio-import' +
        (pdfImportLaeuft || !permitted('bearbeiten', zustand.ordner || undefined)
          ? ' disabled title="Import läuft oder Bearbeitungsrechte fehlen"' : '') +
        '><span data-sym="plus" aria-hidden="true"></span>' +
        '<span class="wort">' + IMPORT_WORT + '</span></button>' +
      /* EINE ZEILE FÜR DIE DREI FRAGEN (E725): WO (Ort), WAS (Art), WIE
         (Form) — je die gewählte Antwort als Pille, die übrigen hinter ihr
         als Menü (`Menue.wahl`, E721). Redur: „von jeder kategorie nur eine
         sehen und die anderen alles unterdem das beim ^". Vorher waren es
         drei Bänke plus Wege, und der Ort stand zweimal da. */
      '<div class="bib-wahl" role="group" aria-label="Was die Bibliothek zeigt">' +
        /* Name, Zahl und Einheit stehen getrennt: am Telefon fällt das Wort
           „Dokumente" weg, nie die Zahl — eine abgeschnittene Zahl ist eine
           andere Zahl (§55.1); „60 von 313" bleibt ganz (L116). */
        ortPille(ort, ' \u00b7 ' + satzZahl, satzEinheit) +
        artPille(alle) +
        /* Die Form bleibt EIN Zeichen (Entscheidung b) — das der gewählten. */
        '<button type="button" class="bib-form-knopf" data-form-wahl aria-haspopup="menu" aria-expanded="false" ' +
          'aria-label="Darstellung: ' + esc(FORMEN.find(f => f.id === form())?.name || '') + '" ' +
          'title="Darstellung: ' + esc(FORMEN.find(f => f.id === form())?.name || '') + '">' +
          '<span data-sym="' + (FORMEN.find(f => f.id === form())?.zeichen || 'pages') + '" aria-hidden="true"></span></button>' +
      '</div>' +
    '</header>';
  };

  const zeichneRegal = (wrap: HTMLElement): void => {
    const { liste: alle, gesamt } = auswahl();
    const liste = zustand.art === 'alle' ? alle : alle.filter(p => artVon(p).id === zustand.art);
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
      '<div class="bib bib-regal-seite" data-bib-bereich>' +
        bibKopf(liste, alle, gesamt) +
        (regal.length
          ? '<div class="bib-regal">' + regal.map(heftKarte).join('') + '</div>'
          : '<p class="bib-leer">Hier ist noch nichts. Seiten erscheinen automatisch.</p>') +
        (hand.length > 1
          ? '<section class="bib-abschnitt"><header><h2>Zuletzt in der Hand</h2>' +
              '<p>heftübergreifend</p></header>' +
              '<div class="bib-hand-reihe">' + hand.map(handKarte).join('') + '</div></section>'
          : '') +
        sicherungsKarte() +
      '</div>';

    if (typeof Register !== 'undefined' && Register.symbole)
      Register.symbole.fuelle(wrap);
    binde(wrap);
    platzNachtragen(wrap);
  };

  /* ══ DIE DREI MENÜS DER ZEILE (E725) ═══════════════════════════════════
     Ort, Art, Form: jedes ist `Menue.wahl` (E721) — ✓ und aria-current am
     Gewählten, aria-expanded am Anker, Pfeiltasten, Escape gibt den Fokus
     zurück; am Rechner steht es an seiner Pille, am Telefon kommt es als
     Blatt mit Karten von unten. Nach der Wahl wird die Seite neu
     gezeichnet — und der Fokus geht an die NEUE Pille, sonst stünde er
     nach Enter auf dem Anfang des Dokuments. */
  const pilleFokus = (wahl: string): void => {
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('.bib ' + wahl)?.focus({ preventScroll: true }));
  };
  /** Die leise Marke (E711) zieht mit ins Ortsmenü: sie steht auf dem
   *  gewählten Ort und gleitet mit dem Fokus und dem Zeiger — das Material
   *  der Wege (E706), das dort keinen Wechsel mehr zu zeigen hat, weil die
   *  Wahl das Menü schliesst. Nur in der Gruppe „Orte". */
  const markeImMenue = (m: HTMLElement): void => {
    if (typeof SelectionFlow === 'undefined') return;
    const gruppe = m.querySelector<HTMLElement>('[role="group"]');
    if (!gruppe) return;
    const auf = (b: Element | null): void => {
      const ziel = b ? b.closest<HTMLElement>('[data-wahl]') : null;
      if (ziel && gruppe.contains(ziel)) SelectionFlow.highlight(gruppe, ziel, { still: true });
    };
    auf(gruppe.querySelector('[aria-current="true"]'));
    gruppe.addEventListener('focusin', e => auf(e.target instanceof Element ? e.target : null));
    gruppe.addEventListener('pointerover', e => auf(e.target instanceof Element ? e.target : null));
  };
  /** Den Zustand eines Ortes setzen, ohne zu zeichnen. „Meine Ablage"
   *  führt an die Wurzel (so tat es der Weg). */
  const ortZustand = (id: string): void => {
    if (id === 'pdf') { zustand.reiter = 'alle'; zustand.art = 'pdf'; }
    else { zustand.reiter = ORTE.some(o => o.id === id) ? id : zustand.reiter; zustand.art = 'alle'; }
    if (id === 'ablage') {
      zustand.ordner = null;
      if (typeof Store !== 'undefined' && Store.setMeta) Store.setMeta(ORDNER_SCHLUESSEL, '');
    }
  };
  /** Einen Ort setzen, wenn man schon im Regal steht (das Ortsmenü). */
  const ortSetzen = (id: string): void => {
    ortZustand(id);
    App.zeichneSeite();
  };
  /** Einen Ort von ÜBERALL her öffnen (E748): erst der Zustand, dann das
   *  Regal — es wird also einmal gezeichnet, nicht zweimal, und nicht ein
   *  Bildschirm, auf dem man gerade gar nicht steht. */
  const ortOeffnen = (id: string): void => {
    ortZustand(id);
    oeffne();
  };
  /** Die Zeichen der sechs Sammlungen (Kennungen aus `Arbeitswelt.sammlungen`). */
  const SAMMLUNG_ZEICHEN: Record<string, string> = {
    uebersicht: 'pages', bibliothek: 'library', datenbanken: 'database',
    whiteboards: 'pencil', wiki: 'graph', vorlagen: 'puzzle'
  };
  const ortMenue = (anker: HTMLElement): void => {
    const aktiv = ortAktiv();
    const sammlungen = typeof Arbeitswelt !== 'undefined' ? Arbeitswelt.sammlungen : [];
    const m = Menue.wahl({
      anker, titel: 'Ort',
      gruppen: [
        { name: 'Orte', optionen: ORTE.map(o => ({ id: o.id, name: o.name, zeichen: o.zeichen, aktiv: o.id === aktiv })) },
        /* DIE SAMMLUNGEN (E457) — bis E725 ein `<select>` hinter „Sammlungen ⌄".
           Sie bleiben ausserdem im Mehr-Blatt und unter ihren Adressen. */
        ...(sammlungen.length ? [{ name: 'Sammlungen', optionen: sammlungen.map(a =>
          ({ id: 'sammlung:' + a.id, name: a.name, zeichen: SAMMLUNG_ZEICHEN[a.id] || 'grid' })) }] : [])
      ],
      beiWahl: (id: string) => {
        if (id.startsWith('sammlung:')) {
          if (typeof Arbeitswelt !== 'undefined') Arbeitswelt.oeffnen(id.slice('sammlung:'.length));
          return;
        }
        ortSetzen(id);
        pilleFokus('[data-orte]');
      }
    });
    markeImMenue(m);
  };
  const artMenue = (anker: HTMLElement): void => {
    const { liste: alle } = auswahl();
    Menue.wahl({
      anker, titel: 'Art',
      gruppen: [{ name: 'Arten', optionen: artenVon(alle).map(a =>
        ({ id: a.id, name: a.name + ' \u00b7 ' + a.zahl, aktiv: a.id === zustand.art })) }],
      beiWahl: (id: string) => {
        zustand.art = ART_FILTER.some(a => a.id === id) ? id : 'alle';
        App.zeichneSeite();
        pilleFokus('[data-art-wahl]');
      }
    });
  };
  const formMenue = (anker: HTMLElement): void => {
    const jetzt = form();
    Menue.wahl({
      anker, titel: 'Darstellung',
      gruppen: [{ name: 'Darstellung', optionen: FORMEN.map(f =>
        ({ id: f.id, name: f.name, zeichen: f.zeichen, aktiv: f.id === jetzt })) }],
      beiWahl: (id: string) => {
        const f = FORMEN.find(x => x.id === id);
        if (!f) return;
        Store.setMeta('bibForm', f.id);
        App.zeichneSeite();
        pilleFokus('[data-form-wahl]');
      }
    });
  };

  /** Was in beiden Formen gleich funktioniert: öffnen und umschalten. */
  /* ══ EIN MENÜ JE DING IN DER BIBLIOTHEK (E721) ════════════════════════
     Deckel, Regal, Tabelle und Ablagebaum zeigen dieselben Dinge — also
     dieselben Aktionen, aus `Register.aktionen`. Die Bibliothek sagt dazu
     nur, WO sie ist und WAS das Ding hier ist (ein Ordner ist ein Ort). */
  const ortFuer = (p: any, anker: HTMLElement | null): AktionOrt =>
    ({ kontext: 'bibliothek', art: artVon(p).id, anker });

  /** Rechtsklick, Kontextmenü-Taste, Umschalt+F10, Entf und langes Drücken
   *  an Deckel, Regal und Tabelle — EIN Binder am Wurzelelement der
   *  Bibliothek, nicht einer je Karte. */
  const aktionenAnbringen = (wrap: HTMLElement): void => {
    const wurzel = wrap.querySelector<HTMLElement>('.bib');
    if (!wurzel || typeof Menue === 'undefined') return;
    /* „Zuletzt geöffnet" zeigt dieselben Dokumente wie die Deckel darunter
       und trägt seine Kennung in `data-rmo-open` — dasselbe Menü dort
       (Durchsicht vom 10. Oktober; Redur: „für den rechts klick bei eine
       dokument … wo es passen kann"). */
    const dingVon = (el: HTMLElement): any =>
      Store.getBlock(el.dataset['id'] || el.dataset['rmoOpen'] || '');
    Menue.aktionenBinden(wurzel, {
      auswahl: '.bib-deckel[data-id], .bib-heft[data-id], .bib-hand[data-id], .bib-zeile[data-id], ' +
        '.rmo-recent-card[data-rmo-open]',
      oeffnen: (el, wo) => {
        const p = dingVon(el);
        if (!p) return false;
        return !!Menue.aktionen(p, ortFuer(p, el),
          wo.tastatur ? { rueckfokus: el } : { x: wo.x ?? 0, y: wo.y ?? 0, rueckfokus: el });
      },
      entf: el => {
        const p = dingVon(el);
        return p ? Register.aktionen.taste('Entf', p, ortFuer(p, el)) : false;
      }
    });
  };

  const binde = (wrap: HTMLElement): void => {
    wrap.querySelectorAll<HTMLElement>('[data-rmo-open]').forEach(button =>
      button.addEventListener('click', () => {
        const id = button.dataset.rmoOpen;
        if (id && permitted('lesen', id)) App.oeffne(id);
      }));
    wrap.querySelector<HTMLDetailsElement>('.bib-ablage-baum')?.addEventListener('toggle', event => {
      Store.setMeta('bibBaumSichtbar', (event.currentTarget as HTMLDetailsElement).open);
    });
    wrap.querySelector('[data-studio-import]')?.addEventListener('click', pdfImportieren);
    wrap.querySelector<HTMLElement>('[data-studio-weiter]')?.addEventListener('click', event => {
      const id = (event.currentTarget as HTMLElement).dataset.studioWeiter;
      if (id && permitted('lesen', id)) App.oeffne(id);
    });
    /* Hier standen bis E725: das Sammlungsfeld (`.bib-studio-sammlungen`),
       die Wege (`[data-studio-weg]`), das Feld „Dokument suchen …" und ein
       Griff für eine Reiterzeile `.bib-reiter [data-r]`, die in Deckel,
       Regal und Liste seit dem 6. September nicht mehr gezeichnet wurde
       (nur „Meine Aufgaben" trägt noch eine, ohne `data-r`). Alles steht
       jetzt in den drei Menüs unten. */
    wrap.querySelector<HTMLElement>('[data-form-wahl]')?.addEventListener('click', ereignis =>
      formMenue(ereignis.currentTarget as HTMLElement));
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

    /* --- Die drei Pillen (E725) ------------------------------------- */
    wrap.querySelector<HTMLElement>('[data-art-wahl]')?.addEventListener('click', ereignis =>
      artMenue(ereignis.currentTarget as HTMLElement));
    wrap.querySelector<HTMLElement>('[data-orte]')?.addEventListener('click', ereignis =>
      ortMenue(ereignis.currentTarget as HTMLElement));
    wrap.querySelectorAll<HTMLElement>('[data-neu-auf]').forEach(b =>
      b.addEventListener('click', () => App.erstellenBlatt(b)));
    wrap.querySelectorAll<HTMLElement>('[data-hoch]').forEach(b =>
      b.addEventListener('click', () => geheHoch()));
    /* Ist der Pfad länger als der Schirm (am Telefon schon ab der dritten
       Ebene), zeigt die Brotkrume von sich aus die WURZEL und schneidet das
       ab, wo man gerade steht. Genau umgekehrt gewollt: der aktuelle Ordner
       ist das Wichtigste. Also ans Ende scrollen. Der Zurück-Pfeil klebt
       links (CSS) und bleibt trotzdem sichtbar. (E381) */
    wrap.querySelectorAll<HTMLElement>('.bib-krume').forEach(krume => {
      krume.scrollLeft = krume.scrollWidth;
    });
    wrap.querySelectorAll<HTMLElement>('[data-ordner]').forEach(b =>
      b.addEventListener('click', () => geheIn(b.dataset['ordner'] || null)));
    blickAnbringen(wrap);
    wrap.querySelectorAll<HTMLElement>('.bib-deckel[data-id]').forEach(k => {
      k.addEventListener('click', () => {
        /* Hier stand: ein Klick auf den ⌄ IM Namen öffnet das Menü, nicht
           das Stück. Seit E721 steht das „…" neben dem Deckel, nicht in ihm. */
        const id = k.dataset['id'];
        if (!id) return;
        /* EIN ORDNER IST EIN ORT, KEIN DOKUMENT (E380). Bis hierher ging
           auch er durch `App.oeffne` — und man landete in einer leeren
           Seite mit Cursor, weil `Inhaltsflaeche` einem Fach ohne Kinder
           sogar einen Textblock anlegt. Der Inhalt stand nur links im
           Baum. */
        if (zustand.reiter === 'ablage' && k.dataset['art'] === 'ordner') { geheIn(id); return; }
        App.oeffne(id);
      });
    });
    /* DAS „…" UND DER RECHTSKLICK (E721): beide fragen `Register.aktionen`
       über `Menue.aktionen` — dieselbe Liste, dieselben Griffe. Hier stand
       eine eigene Liste mit eigenem Umbenennen, eigener Farbe und eigenem
       Papierkorb (bis E718 sogar ein rohes `alive:false`). */
    wrap.querySelectorAll<HTMLElement>('.bib-deckel-mehr[data-mehr-id]').forEach(knopf =>
      knopf.addEventListener('click', ereignis => {
        ereignis.stopPropagation();
        const p = Store.getBlock(knopf.dataset['mehrId'] || '');
        if (!p) return;
        Menue.aktionen(p, ortFuer(p, knopf), { rueckfokus: knopf });
      }));
    aktionenAnbringen(wrap);
  };

  const zeichnen = (wrap: HTMLElement): void => {
    if (zustand.reiter === 'schule') { zeichneSchule(wrap); return; }
    if (form() === 'deckel') { zeichneDeckel(wrap); return; }
    if (form() === 'regal') { zeichneRegal(wrap); return; }
    const { liste: alle, gesamt } = auswahl();
    const liste = zustand.art === 'alle' ? alle : alle.filter(p => artVon(p).id === zustand.art);
    const spalten = SPALTEN.filter(s => zustand.spalten.includes(s.id));
    const raster = spalten.map(s => s.breit).join(' ');

    wrap.innerHTML =
      '<div class="bib" data-bib-bereich>' +
        bibKopf(liste, alle, gesamt) +
        /* Eigene Klasse: `bib-kopf` trägt seit E207 Reiter und Umschalter und
           steht in BEIDEN Formen. Zwei Elemente mit demselben Namen auf einer
           Seite sind zwei Dinge, die gleich aussehen sollen und es beim
           nächsten Stilzusatz nicht mehr tun. */
        '<div class="bib-kopf bib-kopf-liste">' +
          '<div class="bib-werkzeuge">' +
            /* Hier stand „⚟ Filtern" — ein zweiter Ortswähler mit denselben
               Orten wie die Pille im Kopf (E725: eine Wahl je Kategorie).
               Die Lupe öffnet die EINE Suche, im Bereich des Regals. */
            '<button data-a="suche" title="Suchen" aria-label="Suchen">🔍</button>' +
            '<button data-a="spalten" title="Eigenschaften">⚙</button>' +
            '<button data-a="neu" class="prim">Neue Seite</button>' +
          '</div>' +
        '</div>' +
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
                return `<div class="bib-zeile" data-id="${p.id}" data-art="${artVon(p).id}">` +
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
      z.addEventListener('click', () => {
        /* Auch in der Liste ist ein Ordner ein Ort, kein Dokument
           (E380/E382). Die Deckelansicht ging schon hinein; hier stand noch
           die alte Öffnung — ein Fach wäre als leere Seite aufgegangen statt
           eine Ebene tiefer zu führen. Die Nachbarstelle, §45. */
        if (zustand.reiter === 'ablage' && z.dataset.art === 'ordner') {
          geheIn(z.dataset.id); return;
        }
        App.oeffne(z.dataset.id);
      }));

    /* Werkzeuge */
    wrap.querySelectorAll('.bib-werkzeuge button').forEach((b: any) =>
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
        /* DIE EINE SUCHE (E725) — sie öffnet im Bereich dessen, was das Regal
           gerade zeigt; hier ging bis dahin die Zeile „Seiten durchsuchen …"
           auf, ein Titelfilter auf der offenen Ebene. */
        if (a === 'suche') App.suche();
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
  /**
   * Das Regal öffnen — wahlweise in einem bestimmten Ordner (E380).
   *
   * Das Ziel ist der Draht, den der ZIP-Import gebraucht hat: `importZip`
   * kennt seit E350 die Kennung des entstandenen Wurzelfachs, gab sie
   * zurück — und niemand las sie. Jetzt springt der Bildschirm dorthin,
   * statt den Menschen einen Toast lesen zu lassen.
   */
  const oeffne = (ordnerId?: string | null): void => {
    try { Seitenleiste.reiter('dokumente'); } catch { /* ohne Leiste kein Reiter */ }
    if (ordnerId !== undefined) {
      zustand.reiter = 'ablage';
      zustand.art = 'alle';
      zustand.ordner = ordnerId || null;
      if (typeof Store !== 'undefined' && Store.setMeta)
        Store.setMeta(ORDNER_SCHLUESSEL, zustand.ordner || '');
    } else if (zustand.reiter === 'ablage' && zustand.ordner === null) {
      /* Beim gewöhnlichen Öffnen den gemerkten Ordner aufnehmen — wer die
         App zumacht, während er in einem Ordner steht, steht danach wieder
         darin (wie das Heftregal seit E282). */
      zustand.ordner = ordnerLesen();
    }
    App.zeigeSonder('Dokumente', zeichnen);
  };

  /**
   * „ALLE SEITEN" — der Reiter „Alle", die flache Liste über den ganzen
   * Bestand, ohne Ordnerstufen (6. September).
   *
   * Bis dahin rief der Navigationseintrag `app-bib` („Alle Seiten") wie
   * `bibliothekOben` einfach `oeffne()` — seit die Bibliothek das Regal
   * direkt öffnet, waren das zwei Wege zu genau demselben Ziel, und die
   * Zeile in der Kontextkante rief `alleSeiten()`, den Datenhelfer: ein
   * Knopf, der eine Liste zurückgab und nichts zeigte. Jetzt ist es ein
   * eigener Ort mit eigener Adresse (`#alle-seiten`, `SONDER_START` in
   * schale.ts), und das Regal bleibt, was es ist.
   */
  const alleZeigen = (): void => {
    try { Seitenleiste.reiter('dokumente'); } catch { /* ohne Leiste kein Reiter */ }
    zustand.reiter = 'alle';
    zustand.art = 'alle';
    App.zeigeSonder('Alle Seiten', zeichnen);
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

  /* `umfangSatz` und `DECKE_KUERZLICH` kommen mit heraus, damit ein
     Prüflauf die Sprache messen kann, ohne dreihundert Seiten anzulegen
     (test359 §6) — und damit die Decke eine Zahl mit Namen bleibt. */
  /* WAS NUR DIE BIBLIOTHEK WEISS — als Aktionen im Register (E721).
     Ein Ordner ist hier ein Ort (E380): „Öffnen" geht hinein, „Als Seite
     bearbeiten" öffnet seine eigene Seite (Deckel, Symbol, Text) — das, was
     das alte ⌄ „Öffnen" nannte. „Blick hinein" gilt für Ordner und für die
     Fächer der Notizhefte, die dafür ihr eigenes Hineingehen mitgeben. */
  if (typeof Register !== 'undefined' && Register.aktionen) {
    const R = Register.aktionen;
    const ordnerHier = (o: AktionOrt): boolean => o.kontext === 'bibliothek' && o.art === 'ordner';
    R.melde({ id: 'hinein', name: 'Öffnen', zeichen: 'arrowR', gruppe: 'oeffnen', rang: 10,
      gilt: (_p: any, o: AktionOrt) => ordnerHier(o),
      tun: (p: any) => { geheIn(p.id); } });
    R.melde({ id: 'als-seite', name: 'Als Seite bearbeiten', zeichen: 'page', gruppe: 'oeffnen', rang: 20,
      gilt: (_p: any, o: AktionOrt) => ordnerHier(o),
      tun: (p: any) => App.oeffne(p.id) });
    R.melde({ id: 'blick', name: 'Blick hinein', zeichen: 'eye', gruppe: 'oeffnen', rang: 30,
      gilt: (p: any, o: AktionOrt) => ordnerHier(o) ||
        (o.kontext === 'notizhefte' && typeof Notebook !== 'undefined' && Notebook.istFach(p)),
      tun: (p: any, o: AktionOrt) => {
        const r = o.anker && o.anker.isConnected ? o.anker.getBoundingClientRect()
          : new DOMRect(innerWidth / 2, innerHeight / 3, 0, 0);
        if (o.hinein) blickHinein(p, r, false, o.hinein); else blickHinein(p, r);
      } });
  }

  /* ══ DIE ZIELE UNTER „DOKUMENTE" (E748) ═════════════════════════════════
     Redur, Antwort auf Frage 2: „Meine Ablage · Zuletzt · Favoriten · PDFs ·
     Notizhefte". Die vier Orte kommen aus `ORTE` (das Feld `zielRang`
     wählt sie aus und ordnet sie), und weil der Lieferant HIER steht,
     innerhalb des Moduls, bleiben `ORTE`, `ortAktiv` und `ortOeffnen`
     privat — ausgeführt wird nichts davon.

     Die Notizhefte sind kein Ort des Regals, gehören aber unter denselben
     Reiter (Schauplatz `notizhefte` → „Dokumente", `seitenleiste.ts`).
     Name, Zeichen und Weg stehen schon im Navigationsregister
     (`app-notizhefte`) — dort gelesen, nicht hier abgeschrieben (§8).

     `an` fragt den Bildschirm, nicht nur den Zustand: der Zustand bleibt
     stehen, wenn man das Regal verlässt, und „Meine Ablage" wäre sonst
     auch im Lernzentrum „an". */
  if (typeof Register !== 'undefined' && Register.navigation?.meldeZiele) {
    const imRegal = (): boolean => {
      try { return App.schauplatz() === 'bibliothek' && !!document.querySelector('#scroll .bib-ort'); }
      catch { return false; }
    };
    Register.navigation.meldeZiele('dokumente', (): unknown[] => {
      const liste: unknown[] = ORTE.filter(o => typeof o.zielRang === 'number').map(o => ({
        id: o.id, name: o.name, ...(o.kurz ? { kurz: o.kurz } : {}), zeichen: o.zeichen,
        rang: o.zielRang, ort: true,
        an: () => imRegal() && ortAktiv() === o.id,
        tun: () => ortOeffnen(o.id)
      }));
      const heft = Register.navigation.eines?.('app-notizhefte');
      if (heft && typeof heft.tun === 'function') liste.push({
        id: 'notizhefte', name: heft.name, zeichen: heft.zeichen, rang: 5, ort: true,
        zeigen: () => typeof Notebook !== 'undefined' && typeof Notebook.oeffnen === 'function',
        an: () => { try { return App.schauplatz() === 'notizhefte'; } catch { return false; } },
        tun: () => heft.tun()
      });
      return liste;
    });
  }

  return { oeffne, alleZeigen, aufgaben, meineAufgaben, quellenDialog, alleSeiten, quelleVon, suchBereich,
           pdfImportieren, wannText, umfangSatz, DECKE_KUERZLICH,
           /* Der Ordnerblick als Dienst des Bereichs `wissen` (E611):
              `blickKnopf`/`mitBlick` für die Auszeichnung, `blickAnbringen`
              für die Verdrahtung, `blickHinein` für den Weg aus einem Menü
              heraus. Die Notizhefte nutzen alle vier. */
           blickKnopf, mitBlick, blickAnbringen, blickHinein };
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
  K.melde({ bereich: 'bibliothek', id: 'aufgaben', name: 'Meine Aufgaben',
    zeichen: 'tasks', rang: 30, tun: () => Bibliothek.aufgaben() });
  /* `alleZeigen`, nicht `alleSeiten`: das eine öffnet die Liste, das andere
     GIBT sie zurück — als Griff war das ein Knopf ins Leere (§47). */
  K.melde({ bereich: 'bibliothek', id: 'alle', name: 'Alle Seiten',
    zeichen: 'pages', rang: 40, tun: () => Bibliothek.alleZeigen() });
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
