/* ============================================================================
 * arbeitswelt.js — die Hauptwelt „Workspace"
 * ----------------------------------------------------------------------------
 * Diese Datei ist eine Sicht auf den vorhandenen Bestand. Sie führt weder
 * Seiten noch Datenbanken, Aufgaben, Termine oder Fenster ein zweites Mal.
 * Jeder Eintrag wird bei `snapshot()` frisch aus Store, Links, Bibliothek,
 * Register und Fenster abgeleitet; Änderungen gehen ausschliesslich über die
 * dafür bereits vorhandenen Dienste zurück.
 *
 * Die Datei bringt absichtlich keine CSS- oder Schalenänderung mit. Ihre
 * stabilen Integrationshaken sind `produkt-welt arbeitswelt` am Ziel und
 * `aw-*` an allen eigenen Elementen.
 * ==========================================================================*/

const Arbeitswelt = (() => {
  type Ansicht = 'uebersicht' | 'bibliothek' | 'aufgaben' | 'kalender' |
    'datenbanken' | 'whiteboards' | 'wiki' | 'vorlagen';

  type AufgabeQuelle = 'datenbank' | 'block';

  interface BereichEintrag {
    id: string;
    name: string;
    icon: string;
    art: string;
  }

  interface SeitenEintrag {
    id: string;
    titel: string;
    icon: string;
    parentId: string;
    pfad: string;
    tiefe: number;
    blockAnzahl: number;
    aliases: string[];
    backlinkAnzahl: number;
    wiki: boolean;
    bearbeitet: number;
    bereichIds: string[];
  }

  interface AnsichtEintrag {
    id: string;
    name: string;
    layout: string;
    icon: string;
  }

  interface DatenbankEintrag {
    id: string;
    name: string;
    icon: string;
    pageId: string;
    blockId: string;
    zeilen: number;
    ansichten: AnsichtEintrag[];
    bereichIds: string[];
  }

  interface DateiEintrag {
    id: string;
    pageId: string;
    titel: string;
    art: string;
    icon: string;
    dateiId: string;
    bearbeitet: number;
    bereichIds: string[];
  }

  interface BlockEintrag {
    id: string;
    pageId: string;
    titel: string;
    art: string;
    icon: string;
    bearbeitet: number;
    bereichIds: string[];
  }

  interface PdfEintrag {
    pageId: string;
    titel: string;
    seiten: number;
    bearbeitet: number;
    bereichIds: string[];
  }

  interface FlaechenEintrag {
    id: string;
    pageId: string;
    titel: string;
    art: 'whiteboard' | 'blatt';
    icon: string;
    bearbeitet: number;
    formen: number;
    bereichIds: string[];
  }

  interface AufgabenEintrag {
    id: string;
    blockId: string;
    pageId: string;
    titel: string;
    quelle: AufgabeQuelle;
    quelleName: string;
    status: string;
    datum: string;
    zeit: number;
    fertig: boolean;
    bearbeitbar: boolean;
    bereichIds: string[];
  }

  interface TerminEintrag {
    id: string;
    rowId: string;
    pageId: string;
    collectionId: string;
    titel: string;
    quelleName: string;
    feld: string;
    iso: string;
    zeit: number;
    bereichIds: string[];
  }

  interface VorlagenEintrag {
    id: string;
    name: string;
    icon: string;
    text: string;
    quelle: string;
    bereichIds: string[];
  }

  interface ArbeitsweltSnapshot {
    erzeugt: number;
    bereichId: string;
    bereiche: BereichEintrag[];
    seiten: SeitenEintrag[];
    wurzeln: SeitenEintrag[];
    favoriten: SeitenEintrag[];
    kuerzlich: SeitenEintrag[];
    datenbanken: DatenbankEintrag[];
    bloecke: BlockEintrag[];
    dateien: DateiEintrag[];
    pdfs: PdfEintrag[];
    flaechen: FlaechenEintrag[];
    aufgaben: AufgabenEintrag[];
    termine: TerminEintrag[];
    wiki: SeitenEintrag[];
    vorlagen: VorlagenEintrag[];
    zaehler: Record<string, number>;
  }

  interface Zustand {
    ansicht: Ansicht;
    suche: string;
    bereichId: string;
    mobileNavigationOffen: boolean;
  }

  interface ReiterEintrag {
    id: string;
    titel: string;
    aktiv: boolean;
  }

  interface ReiterStatus {
    verfuegbar: boolean;
    reiter: ReiterEintrag[];
    geteilt: { id: string; richtung: string; anteil: number } | null;
  }

  interface ReiterVertrag {
    lesen: () => ReiterStatus;
    oeffnen: (pageId: string) => void;
    wechseln: (index: number) => void;
    schliessen: (index: number) => void;
    teilen: (pageId: string, richtung?: 'quer' | 'hoch') => void;
    teilungSchliessen: () => void;
  }

  interface Controller {
    readonly root: HTMLElement;
    zustand: () => Readonly<Zustand>;
    snapshot: () => ArbeitsweltSnapshot;
    ansichtSetzen: (ansicht: unknown) => void;
    sucheSetzen: (text: unknown) => void;
    bereichSetzen: (bereichId: unknown) => void;
    aktualisieren: () => void;
    oeffneSeite: (pageId: string) => void;
    oeffneBlock: (blockId: string) => void;
    oeffneDatenbankAnsicht: (collectionId: string, viewId: string) => void;
    reiter: ReiterVertrag;
    zerstoeren: () => void;
  }

  const TITEL = '🧱 Workspace';
  const MAX_LISTE = 80;
  const MAX_BEREICHE = 64;
  const MAX_BEREICH_IDS = 1024;
  const ALLE_BEREICHE = 'alle';
  const controllerNachRoot = new WeakMap<HTMLElement, Controller>();
  let instanz = 0;

  const ansichten = Object.freeze([
    { id: 'uebersicht' as Ansicht, icon: '🧱', name: 'Übersicht' },
    { id: 'bibliothek' as Ansicht, icon: '📚', name: 'Bibliothek' },
    { id: 'aufgaben' as Ansicht, icon: '☑', name: 'Aufgaben' },
    { id: 'kalender' as Ansicht, icon: '📅', name: 'Kalender' },
    { id: 'datenbanken' as Ansicht, icon: '▦', name: 'Datenbanken' },
    { id: 'whiteboards' as Ansicht, icon: '🖍', name: 'Whiteboards' },
    { id: 'wiki' as Ansicht, icon: '🕸', name: 'Wiki & Verweise' },
    { id: 'vorlagen' as Ansicht, icon: '🧩', name: 'Vorlagen' }
  ]);

  const dateiIcons: Record<string, string> = {
    file: '📎', image: '🖼', audio: '🎵', video: '🎬'
  };

  const ansichtIcons: Record<string, string> = {
    table: '▦', raster: '🧮', board: '▤', timeline: '▬', calendar: '📅',
    list: '☰', gallery: '▩', chart: '📊', feed: '📰', map: '🗺',
    dashboard: '🧮', pivot: '⊞', form: '📝'
  };

  const alsZeit = (wert: unknown): number => {
    if (typeof wert === 'number') return Number.isFinite(wert) ? wert : 0;
    const zeit = Date.parse(String(wert || ''));
    return Number.isFinite(zeit) ? zeit : 0;
  };

  const alsDatum = (wert: unknown, tiefe = 0): Date | null => {
    if (tiefe > 2 || wert === null || wert === undefined || wert === '') return null;
    if (wert instanceof Date)
      return Number.isFinite(wert.getTime()) ? new Date(wert.getTime()) : null;
    if (typeof wert === 'string' || typeof wert === 'number') {
      const datum = new Date(wert);
      return Number.isFinite(datum.getTime()) ? datum : null;
    }
    if (Array.isArray(wert)) return wert.length ? alsDatum(wert[0], tiefe + 1) : null;
    if (typeof wert === 'object') {
      const satz = wert as Record<string, unknown>;
      for (const key of ['start', 'von', 'date', 'datum', 'value']) {
        const datum = alsDatum(satz[key], tiefe + 1);
        if (datum) return datum;
      }
    }
    return null;
  };

  const datumText = (zeit: number): string => zeit
    ? new Date(zeit).toLocaleDateString('de-CH', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      })
    : 'Ohne Datum';

  const normalisiere = (wert: unknown): string => String(wert || '')
    .normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');

  const normalisiereAnsicht = (wert: unknown): Ansicht => {
    const id = String(wert || 'uebersicht') as Ansicht;
    return ansichten.some(ansicht => ansicht.id === id) ? id : 'uebersicht';
  };

  const idText = (wert: unknown, max = 180): string => String(wert ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

  const lebensbereichApi = (): any => {
    const global = globalThis as any;
    return global?.Lebensbereiche && typeof global.Lebensbereiche === 'object'
      ? global.Lebensbereiche : null;
  };

  /** Liest Definitionen defensiv. Ungültige Einträge werden nur in dieser
      flüchtigen Sicht ausgelassen und niemals im Store bereinigt. */
  const bereichDefinitionen = (): BereichEintrag[] => {
    let roh: unknown = [];
    try {
      const api = lebensbereichApi();
      roh = typeof api?.auflisten === 'function' ? api.auflisten()
        : (typeof Store !== 'undefined' && typeof Store.getMeta === 'function'
            ? Store.getMeta('bereiche', []) : []);
    } catch {
      try {
        roh = typeof Store !== 'undefined' && typeof Store.getMeta === 'function'
          ? Store.getMeta('bereiche', []) : [];
      } catch { roh = []; }
    }
    if (!Array.isArray(roh)) {
      try {
        roh = typeof Store !== 'undefined' && typeof Store.getMeta === 'function'
          ? Store.getMeta('bereiche', []) : [];
      } catch { roh = []; }
    }
    const raus: BereichEintrag[] = [], gesehen = new Set<string>();
    for (const eintrag of Array.isArray(roh) ? roh : []) {
      const id = idText((eintrag as any)?.id);
      const name = idText((eintrag as any)?.name, 80);
      if (!id || id === ALLE_BEREICHE || !name || gesehen.has(id)) continue;
      gesehen.add(id);
      raus.push({
        id, name, icon: idText((eintrag as any)?.icon || '◫', 8) || '◫',
        art: idText((eintrag as any)?.art || 'frei', 32) || 'frei'
      });
      if (raus.length >= MAX_BEREICHE) break;
    }
    return raus.sort((a, b) => a.name.localeCompare(b.name, 'de-CH') ||
      a.id.localeCompare(b.id));
  };

  const normalisiereBereichId = (wert: unknown, bereiche = bereichDefinitionen()): string => {
    const id = idText(wert);
    return id && id !== ALLE_BEREICHE && bereiche.some(bereich => bereich.id === id)
      ? id : ALLE_BEREICHE;
  };

  /** Nur direkte Felder lesen. Die bevorzugte API kennt das kanonische
      `meta.lebensbereiche`; der Fallback hält zusätzlich das alte
      Einzelattribut `bereich` lesbar. */
  const direkteBereichIds = (satz: any): string[] => {
    /* `unknown` stand hier, und darüber lief `for (const wert of roh)` — das
       kann TypeScript nicht durchlassen, und `npm run typecheck` brach
       genau daran ab. Weil `bauen:ts` erst nach dem typecheck läuft, wurde
       KEINE der fünf neuen Dateien je nach `quell/` geschrieben; `index.html`
       lud sie trotzdem, und die ganze Produktwelt war im Browser tot (404).
       Ein Zeichen Typ, fünf tote Module — deshalb steht das hier so
       ausführlich. */
    let roh: unknown[] | null = null;
    try {
      const api = lebensbereichApi();
      if (typeof api?.direkteBereichIds === 'function') {
        const geliefert = api.direkteBereichIds(satz);
        roh = Array.isArray(geliefert) ? geliefert : null;
      }
    } catch { roh = null; }
    if (!Array.isArray(roh)) {
      const meta = satz?.meta && typeof satz.meta === 'object' && !Array.isArray(satz.meta)
        ? satz.meta : {};
      roh = [
        ...(Array.isArray(meta.lebensbereiche) ? meta.lebensbereiche : []),
        ...(satz?.bereich === undefined || satz?.bereich === null ? [] : [satz.bereich])
      ];
    }
    const raus: string[] = [], gesehen = new Set<string>();
    for (const wert of roh) {
      const id = idText(wert);
      if (!id || gesehen.has(id)) continue;
      gesehen.add(id); raus.push(id);
      if (raus.length >= MAX_BEREICH_IDS) break;
    }
    return raus;
  };

  const aktorId = (): string => {
    try {
      const aktuell = lebensbereichApi()?.lernzustand?.aktuellerAktor?.();
      const id = idText(aktuell?.id, 160);
      if (id) return id;
    } catch { /* Konten-Fallback folgt. */ }
    try {
      const konto = typeof Konten !== 'undefined' && typeof Konten.aktiv === 'function'
        ? Konten.aktiv() : null;
      return idText(konto?.id, 160) || 'local';
    } catch { return 'local'; }
  };

  const bereichMetaKey = (): string =>
    `arbeitswelt:bereich:${encodeURIComponent(aktorId()).slice(0, 240)}`;

  const gemerkterBereich = (bereiche: BereichEintrag[]): string => {
    try {
      const wert = typeof Store !== 'undefined' && typeof Store.getMeta === 'function'
        ? Store.getMeta(bereichMetaKey(), ALLE_BEREICHE) : ALLE_BEREICHE;
      return normalisiereBereichId(wert, bereiche);
    } catch { return ALLE_BEREICHE; }
  };

  const bereichMerken = (bereichId: string): void => {
    try {
      if (typeof Store !== 'undefined' && typeof Store.setMeta === 'function')
        Store.setMeta(bereichMetaKey(), bereichId);
    } catch { /* Eine nicht speicherbare UI-Präferenz blockiert die Sicht nicht. */ }
  };

  const rechteAktiv = (): boolean =>
    typeof Konten !== 'undefined' && typeof Konten.darf === 'function';

  const erlaubt = (aktion: 'lesen' | 'bearbeiten', pageId?: string): boolean =>
    !rechteAktiv() || (pageId ? Konten.darf(aktion, pageId) : Konten.darf(aktion));

  const hinweis = (text: string): void => {
    if (typeof UI !== 'undefined' && typeof UI.toast === 'function') UI.toast(text);
  };

  const alleLebendenBloecke = (): any[] => {
    if (typeof Store === 'undefined' || !Store.cache?.blocks) return [];
    return Object.values<any>(Store.cache.blocks).filter(block => block?.alive !== false);
  };

  const seiteVonBlock = (block: any): any | null => {
    if (!block) return null;
    if (block.type === 'page' && block.parentTable !== 'collection') return block;
    if (typeof Links !== 'undefined' && typeof Links.seiteVon === 'function')
      return Links.seiteVon(block.id) || null;
    let aktuell = block;
    let schutz = 0;
    while (aktuell && schutz++ < 60) {
      if (aktuell.type === 'page' && aktuell.parentTable !== 'collection') return aktuell;
      if (aktuell.parentTable === 'collection') {
        const dbBlock = alleLebendenBloecke().find(item => item.type === 'database' &&
          item.collectionId === aktuell.parentId && !item.verknuepft) ||
          alleLebendenBloecke().find(item => item.type === 'database' &&
            item.collectionId === aktuell.parentId);
        aktuell = dbBlock?.parentId ? Store.getBlock(dbBlock.parentId) : null;
      } else {
        aktuell = aktuell.parentId ? Store.getBlock(aktuell.parentId) : null;
      }
    }
    return null;
  };

  const datenbankKontext = (collectionId: string): { block: any | null; page: any | null } => {
    const bloecke = alleLebendenBloecke().filter(block => block.type === 'database' &&
      block.collectionId === collectionId);
    const block = bloecke.find(item => !item.verknuepft) || bloecke[0] || null;
    return { block, page: block ? seiteVonBlock(block) : null };
  };

  const sammlungErlaubt = (aktion: 'lesen' | 'bearbeiten', collectionId: string): boolean => {
    if (!rechteAktiv()) return true;
    const page = datenbankKontext(collectionId).page;
    return !!page && erlaubt(aktion, page.id);
  };

  const leeresSnapshot = (
    bereichId = ALLE_BEREICHE, bereiche: BereichEintrag[] = []
  ): ArbeitsweltSnapshot => ({
    erzeugt: Date.now(), bereichId, bereiche, seiten: [], wurzeln: [], favoriten: [], kuerzlich: [],
    datenbanken: [], bloecke: [], dateien: [], pdfs: [], flaechen: [], aufgaben: [],
    termine: [], wiki: [], vorlagen: [], zaehler: {}
  });

  /**
   * Baut eine flüchtige, schreibgeschützte Sicht auf den aktuellen Bestand.
   * Die Zusammenfassungen enthalten nur Kennungen und Anzeigewerte; die
   * Originaldaten bleiben in Store die einzige Wahrheit.
   */
  const snapshot = (auswahl: unknown = ALLE_BEREICHE): ArbeitsweltSnapshot => {
    const bereiche = bereichDefinitionen();
    const bereichId = normalisiereBereichId(auswahl, bereiche);
    if (typeof Store === 'undefined' || !Store.cache) return leeresSnapshot(bereichId, bereiche);
    const bloecke = alleLebendenBloecke();
    const blockNachId = new Map<string, any>();
    bloecke.forEach(block => {
      const id = idText(block?.id);
      if (id) blockNachId.set(id, block);
    });
    const sammlungen = Object.values<any>(Store.cache.collections || {})
      .filter(collection => !!collection?.id);
    const sammlungNachId = new Map<string, any>(sammlungen
      .map((collection): [string, any] => [String(collection.id), collection]));
    const datenbankBlockNachSammlung = new Map<string, any>();
    bloecke.filter(block => block.type === 'database' && block.collectionId).forEach(block => {
      const id = String(block.collectionId), vorhanden = datenbankBlockNachSammlung.get(id);
      if (!vorhanden || (vorhanden.verknuepft && !block.verknuepft))
        datenbankBlockNachSammlung.set(id, block);
    });
    const bereichReihenfolge = new Map(bereiche
      .map((bereich, index): [string, number] => [bereich.id, index]));
    const sortiereBereichIds = (werte: Iterable<string>): string[] => {
      const raus: string[] = [], gesehen = new Set<string>();
      for (const wert of werte) {
        const id = idText(wert);
        if (!id || gesehen.has(id)) continue;
        gesehen.add(id); raus.push(id);
        if (raus.length >= MAX_BEREICH_IDS) break;
      }
      return raus.sort((a, b) =>
        (bereichReihenfolge.get(a) ?? Number.MAX_SAFE_INTEGER) -
        (bereichReihenfolge.get(b) ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b));
    };
    const blockBereichCache = new Map<string, string[]>();
    const sammlungBereichCache = new Map<string, string[]>();
    const bereicheVonBlock = (block: any, spur = new Set<string>(), tiefe = 0): string[] => {
      if (!block || tiefe >= 50) return [];
      const id = idText(block.id), key = id ? `block:${id}` : '';
      if (key && blockBereichCache.has(id)) return blockBereichCache.get(id) || [];
      const direkt = direkteBereichIds(block);
      if (!key || spur.has(key)) return sortiereBereichIds(direkt);
      const naechsteSpur = new Set(spur); naechsteSpur.add(key);
      let geerbt: string[] = [];
      if (block.parentTable === 'collection') {
        const collectionId = idText(block.parentId);
        const collection = sammlungNachId.get(collectionId) ||
          (typeof Store.getCollection === 'function' ? Store.getCollection(collectionId) : null);
        geerbt = bereicheVonSammlung(collection, naechsteSpur, tiefe + 1);
      } else if (block.parentId) {
        const parentId = idText(block.parentId);
        const parent = blockNachId.get(parentId) ||
          (typeof Store.getBlock === 'function' ? Store.getBlock(parentId) : null);
        geerbt = bereicheVonBlock(parent, naechsteSpur, tiefe + 1);
      }
      const ergebnis = sortiereBereichIds([...direkt, ...geerbt]);
      if (id) blockBereichCache.set(id, ergebnis);
      return ergebnis;
    };
    const bereicheVonSammlung = (
      collection: any, spur = new Set<string>(), tiefe = 0
    ): string[] => {
      if (!collection || tiefe >= 50) return [];
      const id = idText(collection.id), key = id ? `collection:${id}` : '';
      if (id && sammlungBereichCache.has(id)) return sammlungBereichCache.get(id) || [];
      const direkt = direkteBereichIds(collection);
      if (!key || spur.has(key)) return sortiereBereichIds(direkt);
      const naechsteSpur = new Set(spur); naechsteSpur.add(key);
      const traeger = datenbankBlockNachSammlung.get(id);
      const ergebnis = sortiereBereichIds([
        ...direkt, ...bereicheVonBlock(traeger, naechsteSpur, tiefe + 1)
      ]);
      if (id) sammlungBereichCache.set(id, ergebnis);
      return ergebnis;
    };
    const passtBereich = (ids: string[]): boolean =>
      bereichId === ALLE_BEREICHE || ids.includes(bereichId);
    const seitenCache = new Map<string, any | null>();
    const besitzerVon = (block: any): any | null => {
      const id = String(block?.id || '');
      if (seitenCache.has(id)) return seitenCache.get(id) || null;
      const page = seiteVonBlock(block);
      seitenCache.set(id, page || null);
      return page || null;
    };
    const alleLesbarenSeiten = bloecke.filter(block => block.type === 'page' &&
      block.parentTable !== 'collection' && !block.system && erlaubt('lesen', block.id));
    const lesbareIds = new Set(alleLesbarenSeiten.map(page => String(page.id)));
    const bereicheNachSeite = new Map<string, string[]>(alleLesbarenSeiten
      .map((page): [string, string[]] => [String(page.id), bereicheVonBlock(page)]));
    const roheSeiten = alleLesbarenSeiten.filter(page =>
      passtBereich(bereicheNachSeite.get(String(page.id)) || []));
    const sichtbareSeitenIds = new Set(roheSeiten.map(page => String(page.id)));
    const direkteKinder = new Map<string, number>();
    bloecke.forEach(block => {
      if (block.parentTable !== 'collection' && block.parentId &&
          passtBereich(bereicheVonBlock(block)))
        direkteKinder.set(String(block.parentId), (direkteKinder.get(String(block.parentId)) || 0) + 1);
    });

    const aliasesNachId = new Map<string, string[]>();
    roheSeiten.forEach(page => {
      const aliases = typeof Links !== 'undefined' && typeof Links.aliasesVon === 'function'
        ? Links.aliasesVon(page) : (Array.isArray(page.aliases) ? page.aliases.map(String) : []);
      aliasesNachId.set(String(page.id), aliases);
    });

    /* Ein einziger flüchtiger Referenzindex ersetzt N vollständige
       `Links.verweiseAuf`-Scans. Mehrdeutige Namen erzeugen bewusst keinen
       Rückverweis — dieselbe Kollisionsregel wie im Linkdienst. */
    const namensIndex = new Map<string, string[]>();
    const indexiere = (name: unknown, pageId: string): void => {
      const key = normalisiere(name);
      if (!key) return;
      const liste = namensIndex.get(key) || [];
      if (!liste.includes(pageId)) liste.push(pageId);
      namensIndex.set(key, liste);
    };
    roheSeiten.forEach(page => {
      indexiere(page.text, String(page.id));
      (aliasesNachId.get(String(page.id)) || []).forEach(alias => indexiere(alias, String(page.id)));
    });
    const rueckverweise = new Map<string, Set<string>>();
    bloecke.forEach(block => {
      if (!block.text || !passtBereich(bereicheVonBlock(block))) return;
      const quelle = besitzerVon(block);
      if (!quelle || !sichtbareSeitenIds.has(String(quelle.id))) return;
      const muster = /\[\[([^\[\]\n|]{1,240})(?:\|[^\]\n]{1,240})?\]\]/g;
      let treffer: RegExpExecArray | null;
      while ((treffer = muster.exec(String(block.text))) !== null) {
        const kandidaten = namensIndex.get(normalisiere(treffer[1])) || [];
        const ziel = kandidaten.length === 1 ? kandidaten[0] : '';
        if (!ziel || ziel === String(quelle.id)) continue;
        const quellen = rueckverweise.get(ziel) || new Set<string>();
        quellen.add(String(quelle.id));
        rueckverweise.set(ziel, quellen);
      }
    });

    const seiten: SeitenEintrag[] = roheSeiten.map(page => {
      const pfad = typeof Store.pathOf === 'function' ? Store.pathOf(page.id) : [page];
      return {
        id: String(page.id), titel: String(page.text || 'Ohne Titel'),
        icon: String(page.icon || '📄'),
        parentId: page.parentId && sichtbareSeitenIds.has(String(page.parentId))
          ? String(page.parentId) : '',
        pfad: pfad.map((teil: any) => String(teil.text || 'Ohne Titel')).join(' / '),
        tiefe: Math.max(0, pfad.length - 1),
        blockAnzahl: direkteKinder.get(String(page.id)) || 0,
        aliases: aliasesNachId.get(String(page.id)) || [],
        backlinkAnzahl: rueckverweise.get(String(page.id))?.size || 0,
        wiki: !!page.wiki,
        bearbeitet: alsZeit(page.edited || page.created),
        bereichIds: bereicheNachSeite.get(String(page.id)) || []
      };
    }).sort((a, b) => a.pfad.localeCompare(b.pfad, 'de'));
    const seiteNachId = new Map(seiten.map(page => [page.id, page]));

    const favoriten = (typeof Store.favorites === 'function' ? Store.favorites() : roheSeiten
      .filter(page => page.favorite)).map((page: any) => seiteNachId.get(String(page.id)))
      .filter((page: SeitenEintrag | undefined): page is SeitenEintrag => !!page);
    const kuerzlichRoh = typeof App !== 'undefined' && typeof App.kuerzlich === 'function'
      ? App.kuerzlich() : [...roheSeiten].sort((a, b) =>
          alsZeit(b.zuletztGeoeffnet || b.edited) - alsZeit(a.zuletztGeoeffnet || a.edited)).slice(0, 12);
    const kuerzlich = kuerzlichRoh.map((page: any) => seiteNachId.get(String(page.id)))
      .filter((page: SeitenEintrag | undefined): page is SeitenEintrag => !!page);

    const datenbanken: DatenbankEintrag[] = sammlungen
      .filter(collection => sammlungErlaubt('lesen', String(collection.id)) &&
        passtBereich(bereicheVonSammlung(collection)))
      .map(collection => {
        const kontext = datenbankKontext(String(collection.id));
        const bereichIds = bereicheVonSammlung(collection);
        const views = (Array.isArray(collection.viewIds) ? collection.viewIds : [])
          .map((viewId: string) => typeof Store.getView === 'function' ? Store.getView(viewId) :
            Store.cache.views?.[viewId])
          .filter((view: any) => !!view)
          .map((view: any): AnsichtEintrag => {
            const layout = String(view.layout || 'table');
            const register = typeof Register !== 'undefined' ? Register.ansichten : null;
            return {
              id: String(view.id), name: String(view.name ||
                (register?.name ? register.name(layout) : layout)), layout,
              icon: String(register?.icon ? register.icon(layout) : (ansichtIcons[layout] || '▦'))
            };
          });
        const rows = typeof Store.rowsOf === 'function' ? Store.rowsOf(collection.id) : [];
        return {
          id: String(collection.id), name: String(collection.name || 'Datenbank'),
          icon: String(collection.icon || '🗂️'), pageId: String(kontext.page?.id || ''),
          blockId: String(kontext.block?.id || ''),
          zeilen: rows.filter((row: any) => row?.alive !== false &&
            passtBereich(bereicheVonBlock(row))).length,
          ansichten: views, bereichIds
        };
      }).sort((a, b) => a.name.localeCompare(b.name, 'de'));

    const ausgegliederteBlockarten = new Set([
      'page', 'database', 'file', 'image', 'audio', 'video', 'pdfseite', 'whiteboard', 'blatt'
    ]);
    const inhaltsBloecke: BlockEintrag[] = bloecke
      .filter(block => !ausgegliederteBlockarten.has(String(block.type)))
      .map(block => {
        const page = besitzerVon(block);
        const bereichIds = bereicheVonBlock(block);
        if (!page || !lesbareIds.has(String(page.id)) || !passtBereich(bereichIds)) return null;
        const register = typeof Register !== 'undefined' && Register.bloecke?.eines
          ? Register.bloecke.eines(String(block.type)) : null;
        return {
          id: String(block.id), pageId: String(page.id),
          titel: String(block.text || register?.name || block.type || 'Block'),
          art: String(block.type || 'block'), icon: String(register?.icon || '◻'),
          bearbeitet: alsZeit(block.edited || block.created), bereichIds
        };
      }).filter((block: BlockEintrag | null): block is BlockEintrag => !!block)
      .sort((a, b) => b.bearbeitet - a.bearbeitet);

    const dateien: DateiEintrag[] = bloecke.filter(block =>
      ['file', 'image', 'audio', 'video'].includes(String(block.type)))
      .map(block => {
        const page = besitzerVon(block);
        const bereichIds = bereicheVonBlock(block);
        if (!page || !lesbareIds.has(String(page.id)) || !passtBereich(bereichIds)) return null;
        return {
          id: String(block.id), pageId: String(page.id),
          titel: String(block.text || block.name || block.dateiname || 'Ohne Namen'),
          art: String(block.type), icon: dateiIcons[String(block.type)] || '📎',
          dateiId: String(block.dateiId || ''), bearbeitet: alsZeit(block.edited || block.created),
          bereichIds
        };
      }).filter((datei: DateiEintrag | null): datei is DateiEintrag => !!datei)
      .sort((a, b) => b.bearbeitet - a.bearbeitet);

    const pdfNachSeite = new Map<string, PdfEintrag>();
    bloecke.filter(block => block.type === 'pdfseite').forEach(block => {
      const page = besitzerVon(block);
      const bereichIds = bereicheVonBlock(block);
      if (!page || !lesbareIds.has(String(page.id)) || !passtBereich(bereichIds)) return;
      const id = String(page.id), vorhanden = pdfNachSeite.get(id);
      const bearbeitet = alsZeit(block.edited || block.created);
      if (vorhanden) {
        vorhanden.seiten++;
        vorhanden.bearbeitet = Math.max(vorhanden.bearbeitet, bearbeitet);
        vorhanden.bereichIds = sortiereBereichIds([...vorhanden.bereichIds, ...bereichIds]);
      } else {
        pdfNachSeite.set(id, { pageId: id, titel: String(page.text || 'PDF'),
          seiten: 1, bearbeitet, bereichIds });
      }
    });
    const pdfs = [...pdfNachSeite.values()].sort((a, b) => b.bearbeitet - a.bearbeitet);

    const flaechen: FlaechenEintrag[] = bloecke.filter(block =>
      block.type === 'whiteboard' || block.type === 'blatt').map(block => {
        const page = besitzerVon(block);
        const bereichIds = bereicheVonBlock(block);
        if (!page || !lesbareIds.has(String(page.id)) || !passtBereich(bereichIds)) return null;
        const art = block.type === 'blatt' ? 'blatt' as const : 'whiteboard' as const;
        return {
          id: String(block.id), pageId: String(page.id),
          titel: String(block.text || page.text || (art === 'blatt' ? 'Tabelle' : 'Whiteboard')),
          art, icon: art === 'blatt' ? '📊' : '🎨',
          bearbeitet: alsZeit(block.edited || block.created),
          formen: Array.isArray(block.shapes) ? block.shapes.length : 0, bereichIds
        };
      }).filter((flaeche: FlaechenEintrag | null): flaeche is FlaechenEintrag => !!flaeche)
      .sort((a, b) => b.bearbeitet - a.bearbeitet);

    const aufgaben: AufgabenEintrag[] = [];
    const aufgabenIds = new Set<string>();
    if (typeof Bibliothek !== 'undefined' && typeof Bibliothek.meineAufgaben === 'function') {
      Bibliothek.meineAufgaben().forEach((aufgabe: any) => {
        const datum = alsDatum(aufgabe.datum);
        const id = String(aufgabe.id || '');
        if (!id || aufgabenIds.has(id)) return;
        const row = blockNachId.get(id) ||
          (typeof Store.getBlock === 'function' ? Store.getBlock(id) : null);
        const collection = aufgabe.coll || (row?.parentTable === 'collection'
          ? sammlungNachId.get(String(row.parentId)) : null);
        const bereichIds = row ? bereicheVonBlock(row) : bereicheVonSammlung(collection);
        if (!passtBereich(bereichIds)) return;
        aufgabenIds.add(id);
        aufgaben.push({
          id, blockId: '', pageId: String(aufgabe.pageId || ''),
          titel: String(aufgabe.titel || 'Ohne Titel'), quelle: 'datenbank',
          quelleName: String(aufgabe.coll?.name || 'Datenbank'),
          status: String(aufgabe.status || (aufgabe.fertig ? 'Fertig' : 'Offen')),
          datum: datum ? datum.toISOString() : '', zeit: datum?.getTime() || 0,
          fertig: !!aufgabe.fertig, bearbeitbar: aufgabe.bearbeitbar !== false,
          bereichIds
        });
      });
    }
    bloecke.filter(block => block.type === 'todo').forEach(block => {
      const page = besitzerVon(block);
      const id = String(block.id || '');
      const bereichIds = bereicheVonBlock(block);
      if (!page || !lesbareIds.has(String(page.id)) || !id || aufgabenIds.has(id) ||
          !passtBereich(bereichIds)) return;
      const datum = alsDatum(block.datum || block.date || block.faellig);
      aufgabenIds.add(id);
      aufgaben.push({
        id, blockId: id, pageId: String(page.id), titel: String(block.text || 'Aufgabe'),
        quelle: 'block', quelleName: String(page.text || 'Seite'),
        status: block.checked ? 'Fertig' : 'Offen', datum: datum ? datum.toISOString() : '',
        zeit: datum?.getTime() || 0, fertig: !!block.checked,
        bearbeitbar: erlaubt('bearbeiten', String(page.id)), bereichIds
      });
    });
    aufgaben.sort((a, b) => Number(a.fertig) - Number(b.fertig) ||
      (a.zeit || Number.MAX_SAFE_INTEGER) - (b.zeit || Number.MAX_SAFE_INTEGER) ||
      a.titel.localeCompare(b.titel, 'de'));

    const termine: TerminEintrag[] = [];
    sammlungen.forEach(collection => {
      if (!collection?.id || !sammlungErlaubt('lesen', String(collection.id))) return;
      const kontext = datenbankKontext(String(collection.id));
      const datumsfelder = Object.keys(collection.schema || {})
        .filter(key => collection.schema[key]?.type === 'date');
      if (!datumsfelder.length) return;
      const rows = typeof Store.rowsOf === 'function' ? Store.rowsOf(collection.id) : [];
      rows.filter((row: any) => row?.alive !== false).forEach((row: any) => {
        const bereichIds = bereicheVonBlock(row);
        if (!passtBereich(bereichIds)) return;
        datumsfelder.forEach(key => {
          const roh = typeof Datenbank !== 'undefined' && typeof Datenbank.wert === 'function'
            ? Datenbank.wert(row, key, collection) : row.props?.[key];
          const datum = alsDatum(roh);
          if (!datum) return;
          termine.push({
            id: `${String(row.id)}:${key}`, rowId: String(row.id),
            pageId: String(kontext.page?.id || ''), collectionId: String(collection.id),
            titel: String(row.text || row.props?.title || 'Ohne Titel'),
            quelleName: String(collection.name || 'Datenbank'),
            feld: String(collection.schema[key]?.name || 'Datum'),
            iso: datum.toISOString(), zeit: datum.getTime(), bereichIds
          });
        });
      });
    });
    termine.sort((a, b) => a.zeit - b.zeit || a.titel.localeCompare(b.titel, 'de'));

    const wiki = seiten.filter(page => page.wiki || page.aliases.length > 0 ||
      page.backlinkAnzahl > 0).sort((a, b) => b.backlinkAnzahl - a.backlinkAnzahl ||
        a.titel.localeCompare(b.titel, 'de'));

    let vorlagen: VorlagenEintrag[] = [];
    if (typeof Register !== 'undefined' && Register.vorlagen?.alle) {
      vorlagen = Register.vorlagen.alle().map((vorlage: any) => ({
        id: String(vorlage.id), name: String(vorlage.name || vorlage.id),
        icon: String(vorlage.icon || '🧩'), text: String(vorlage.text || ''),
        quelle: String(vorlage.quelle || ''), bereichIds: direkteBereichIds(vorlage)
      })).filter((vorlage: VorlagenEintrag) => passtBereich(vorlage.bereichIds));
    } else if (typeof Galerie !== 'undefined' && Array.isArray(Galerie.VORLAGEN)) {
      vorlagen = Galerie.VORLAGEN.map((vorlage: any) => ({
        id: String(vorlage.id), name: String(vorlage.name || vorlage.id),
        icon: String(vorlage.icon || '🧩'), text: String(vorlage.text || ''),
        quelle: String(vorlage.quelle || ''), bereichIds: direkteBereichIds(vorlage)
      })).filter((vorlage: VorlagenEintrag) => passtBereich(vorlage.bereichIds));
    }
    vorlagen.sort((a, b) => a.name.localeCompare(b.name, 'de-CH') || a.id.localeCompare(b.id));

    return {
      erzeugt: Date.now(), bereichId, bereiche,
      seiten, wurzeln: seiten.filter(page => !page.parentId),
      favoriten, kuerzlich, datenbanken, bloecke: inhaltsBloecke, dateien, pdfs, flaechen, aufgaben,
      termine, wiki, vorlagen,
      zaehler: {
        seiten: seiten.length, bloecke: inhaltsBloecke.length, datenbanken: datenbanken.length,
        dateien: dateien.length, pdfs: pdfs.length,
        whiteboards: flaechen.filter(item => item.art === 'whiteboard').length,
        tabellen: flaechen.filter(item => item.art === 'blatt').length,
        aufgaben: aufgaben.length, offeneAufgaben: aufgaben.filter(item => !item.fertig).length,
        termine: termine.length, wiki: wiki.length, vorlagen: vorlagen.length
      }
    };
  };

  const reiterVertrag = (): ReiterVertrag => {
    const verfuegbar = (): boolean => typeof Fenster !== 'undefined' &&
      typeof Fenster.reiter === 'function';
    return {
      lesen: (): ReiterStatus => {
        if (!verfuegbar()) return { verfuegbar: false, reiter: [], geteilt: null };
        const aktiv = Number(Fenster.aktiv?.() || 0);
        const geteilt = Fenster.geteilt?.() || null;
        return {
          verfuegbar: true,
          reiter: (Fenster.reiter() || []).map((reiter: any, index: number) => {
            const page = Store.getBlock(reiter.id);
            return { id: String(reiter.id), titel: String(page
              ? `${page.icon || '📄'} ${page.text || 'Ohne Titel'}` : 'Nicht mehr vorhanden'),
              aktiv: index === aktiv };
          }),
          geteilt: geteilt ? { id: String(geteilt.id), richtung: String(geteilt.richtung || 'quer'),
            anteil: Number(geteilt.anteil || 50) } : null
        };
      },
      oeffnen: (pageId: string): void => {
        if (verfuegbar() && typeof Fenster.neuerReiter === 'function') Fenster.neuerReiter(pageId);
        else if (typeof App !== 'undefined') App.oeffne(pageId);
      },
      wechseln: (index: number): void => {
        if (verfuegbar() && typeof Fenster.wechseln === 'function') Fenster.wechseln(index);
      },
      schliessen: (index: number): void => {
        if (verfuegbar() && typeof Fenster.schliessen === 'function') Fenster.schliessen(index);
      },
      teilen: (pageId: string, richtung = 'quer'): void => {
        if (verfuegbar() && typeof Fenster.teilen === 'function') Fenster.teilen(pageId, richtung);
      },
      teilungSchliessen: (): void => {
        if (verfuegbar() && typeof Fenster.teilenAus === 'function') Fenster.teilenAus();
      }
    };
  };

  const element = <K extends keyof HTMLElementTagNameMap>(
    name: K, klasse = '', text?: string
  ): HTMLElementTagNameMap[K] => {
    const node = document.createElement(name);
    if (klasse) node.className = klasse;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const knopf = (text: string, klasse = ''): HTMLButtonElement => {
    const button = element('button', klasse, text);
    button.type = 'button';
    return button;
  };

  const aktionsKnopf = (icon: string, text: string, aktion: string): HTMLButtonElement => {
    const button = knopf('', 'aw-aktion');
    button.dataset.awAction = aktion;
    button.append(element('span', 'aw-aktion-icon', icon), element('span', 'aw-aktion-text', text));
    return button;
  };

  const bereich = (id: string, titel: string, beschreibung = ''): HTMLElement => {
    const section = element('section', 'aw-bereich');
    const headingId = `${id}-titel`;
    section.id = id;
    section.setAttribute('aria-labelledby', headingId);
    const kopf = element('div', 'aw-bereich-kopf');
    const h2 = element('h2', 'aw-bereich-titel', titel); h2.id = headingId;
    kopf.append(h2);
    if (beschreibung) kopf.append(element('p', 'aw-bereich-text', beschreibung));
    section.append(kopf);
    return section;
  };

  const leer = (titel: string, text: string, aktion = '', label = ''): HTMLElement => {
    const box = element('div', 'aw-leer'); box.setAttribute('role', 'status');
    box.append(element('h3', 'aw-leer-titel', titel), element('p', 'aw-leer-text', text));
    if (aktion && label) box.append(aktionsKnopf('＋', label, aktion));
    return box;
  };

  const passt = (suche: string, ...werte: unknown[]): boolean => {
    const query = normalisiere(suche);
    return !query || werte.some(wert => normalisiere(wert).includes(query));
  };

  const ressourcenZeile = (
    icon: string, titel: string, meta: string, pageId: string, blockId = ''
  ): HTMLLIElement => {
    const item = element('li', 'aw-eintrag');
    const open = knopf('', 'aw-eintrag-haupt');
    if (blockId) open.dataset.awBlock = blockId;
    else open.dataset.awOpen = pageId;
    open.append(element('span', 'aw-eintrag-icon', icon));
    const text = element('span', 'aw-eintrag-inhalt');
    text.append(element('strong', 'aw-eintrag-titel', titel), element('small', 'aw-eintrag-meta', meta));
    open.append(text); item.append(open);
    if (pageId) {
      const actions = element('span', 'aw-eintrag-aktionen');
      const tab = knopf('↗', 'aw-mini'); tab.title = 'In neuem Reiter öffnen';
      tab.dataset.awOpenTab = pageId;
      const split = knopf('⊞', 'aw-mini'); split.title = 'Geteilt öffnen';
      split.dataset.awSplit = pageId;
      actions.append(tab, split); item.append(actions);
    }
    return item;
  };

  const seitenListe = (seiten: SeitenEintrag[], suche: string, leerText: string): HTMLElement => {
    const list = element('ul', 'aw-liste');
    const sichtbar = seiten.filter(page => passt(suche, page.titel, page.pfad, page.aliases.join(' ')))
      .slice(0, MAX_LISTE);
    sichtbar.forEach(page => list.append(ressourcenZeile(page.icon, page.titel,
      page.pfad === page.titel ? `${page.blockAnzahl} Einträge` : page.pfad, page.id)));
    return sichtbar.length ? list : leer('Noch nichts hier', leerText, 'new-page', 'Seite anlegen');
  };

  const zaehlerKarte = (icon: string, label: string, wert: number, ziel: Ansicht): HTMLButtonElement => {
    const card = knopf('', 'aw-zaehler'); card.dataset.awSection = ziel;
    card.append(element('span', 'aw-zaehler-icon', icon),
      element('strong', 'aw-zaehler-wert', String(wert)), element('span', 'aw-zaehler-label', label));
    return card;
  };

  const sucheKopf = (zustand: Zustand, platzhalter: string): HTMLElement => {
    const form = element('form', 'aw-suche'); form.setAttribute('role', 'search');
    form.dataset.awSearchForm = 'true';
    const label = element('label', 'aw-visuell-versteckt', 'Workspace durchsuchen');
    const input = element('input', 'aw-suche-eingabe'); input.type = 'search';
    input.placeholder = platzhalter; input.value = zustand.suche; input.dataset.awQuery = 'true';
    label.htmlFor = `aw-suche-${instanz}`; input.id = label.htmlFor;
    const anwenden = knopf('Anzeigen', 'aw-suche-knopf'); anwenden.dataset.awAction = 'apply-search';
    const leeren = knopf('Leeren', 'aw-suche-leeren'); leeren.dataset.awAction = 'clear-search';
    form.append(label, input, anwenden, leeren); return form;
  };

  const bereichAuswahl = (
    daten: ArbeitsweltSnapshot, zustand: Zustand, id: string
  ): HTMLElement => {
    const feld = element('div', 'aw-bereichsfilter');
    const label = element('label', 'aw-bereichsfilter-label', 'Lebensbereich');
    const select = element('select', 'aw-bereichsfilter-auswahl');
    select.id = `${id}-bereich`; label.htmlFor = select.id;
    select.dataset.awBereich = 'true';
    select.setAttribute('aria-label', 'Workspace nach Lebensbereich filtern');
    const alle = element('option', '', '◎ Alle Bereiche'); alle.value = ALLE_BEREICHE;
    select.append(alle);
    daten.bereiche.forEach(bereich => {
      const option = element('option', '', `${bereich.icon} ${bereich.name}`);
      option.value = bereich.id; select.append(option);
    });
    select.value = normalisiereBereichId(zustand.bereichId, daten.bereiche);
    label.append(select); feld.append(label);
    return feld;
  };

  const zeichneUebersicht = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const quick = bereich('aw-quick', 'Schnell starten',
      'Alle Aktionen schreiben über die bestehenden Redion-Dienste in denselben Bestand.');
    const actions = element('div', 'aw-aktionen');
    actions.append(
      aktionsKnopf('📄', 'Neue Seite', 'new-page'),
      aktionsKnopf('▦', 'Neue Datenbank', 'new-database'),
      aktionsKnopf('🎨', 'Whiteboard', 'new-whiteboard'),
      aktionsKnopf('📎', 'Dateien einlesen', 'import-files'),
      aktionsKnopf('📷', 'Scannen', 'capture'),
      aktionsKnopf('🧩', 'Vorlage', 'show-templates'),
      aktionsKnopf('🔍', 'Globale Suche', 'global-search'),
      aktionsKnopf('💾', 'Sicherung', 'backup')
    );
    quick.append(actions); main.append(quick);

    const summary = bereich('aw-bestand', 'Dein Bestand');
    const cards = element('div', 'aw-zaehler-grid');
    cards.append(
      zaehlerKarte('📄', 'Seiten', daten.zaehler.seiten || 0, 'bibliothek'),
      zaehlerKarte('▦', 'Datenbanken', daten.zaehler.datenbanken || 0, 'datenbanken'),
      zaehlerKarte('☐', 'Offene Aufgaben', daten.zaehler.offeneAufgaben || 0, 'aufgaben'),
      zaehlerKarte('📅', 'Termine', daten.zaehler.termine || 0, 'kalender'),
      zaehlerKarte('🖍', 'Whiteboards', daten.zaehler.whiteboards || 0, 'whiteboards'),
      zaehlerKarte('🕸', 'Wiki-Seiten', daten.zaehler.wiki || 0, 'wiki'),
      zaehlerKarte('🧩', 'Vorlagen', daten.zaehler.vorlagen || 0, 'vorlagen')
    );
    summary.append(cards); main.append(summary);

    const grid = element('div', 'aw-uebersicht-grid');
    const recent = bereich('aw-kuerzlich', 'Zuletzt geöffnet');
    recent.append(seitenListe(daten.kuerzlich, zustand.suche,
      'Geöffnete Seiten erscheinen hier automatisch.'));
    const fav = bereich('aw-favoriten', 'Favoriten');
    fav.append(seitenListe(daten.favoriten, zustand.suche,
      'Markiere Seiten mit einem Stern, um sie hier zu sammeln.'));
    grid.append(recent, fav); main.append(grid);

    const arbeit = element('div', 'aw-uebersicht-grid');
    const tasks = bereich('aw-offen', 'Als Nächstes');
    const taskList = element('ul', 'aw-liste');
    const offene = daten.aufgaben.filter(task => !task.fertig &&
      passt(zustand.suche, task.titel, task.quelleName)).slice(0, 8);
    offene.forEach(task => taskList.append(ressourcenZeile('☐', task.titel,
      `${task.quelleName}${task.zeit ? ` · ${datumText(task.zeit)}` : ''}`,
      task.quelle === 'datenbank' ? task.id : task.pageId, task.blockId)));
    tasks.append(offene.length ? taskList : leer('Alles erledigt',
      'Offene Todo-Blöcke und Aufgabenzeilen erscheinen hier automatisch.'));
    const calendar = bereich('aw-naechste-termine', 'Nächste Termine');
    const eventList = element('ul', 'aw-liste');
    const jetzt = Date.now() - 86400000;
    const events = daten.termine.filter(event => event.zeit >= jetzt &&
      passt(zustand.suche, event.titel, event.quelleName, event.feld)).slice(0, 8);
    events.forEach(event => eventList.append(ressourcenZeile('📅', event.titel,
      `${datumText(event.zeit)} · ${event.quelleName}`, event.rowId || event.pageId)));
    calendar.append(events.length ? eventList : leer('Keine kommenden Termine',
      'Datumsfelder aus lesbaren Datenbanken werden hier zusammengeführt.'));
    arbeit.append(tasks, calendar); main.append(arbeit);
  };

  const zeichneBibliothek = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-bibliothek-kopf', 'Zentrale Bibliothek',
      'Seiten, Dateien, PDFs, Whiteboards und Tabellen bleiben an ihrem ursprünglichen Ort.');
    header.append(sucheKopf(zustand, 'Titel, Pfad oder Alias …'));
    const cards = element('div', 'aw-zaehler-grid');
    cards.append(
      zaehlerKarte('📄', 'Seiten', daten.seiten.length, 'bibliothek'),
      zaehlerKarte('◻', 'Inhaltsblöcke', daten.bloecke.length, 'bibliothek'),
      zaehlerKarte('📎', 'Dateien', daten.dateien.length, 'bibliothek'),
      zaehlerKarte('📕', 'PDF-Dokumente', daten.pdfs.length, 'bibliothek'),
      zaehlerKarte('🎨', 'Whiteboards', daten.zaehler.whiteboards || 0, 'bibliothek'),
      zaehlerKarte('📊', 'Tabellen', daten.zaehler.tabellen || 0, 'bibliothek')
    );
    header.append(cards); main.append(header);

    const pages = bereich('aw-seiten', 'Seiten & Unterseiten');
    pages.append(seitenListe(daten.seiten, zustand.suche,
      'Lege deine erste Seite an; Unterseiten werden über ihren bestehenden Pfad eingeordnet.'));
    main.append(pages);

    const grid = element('div', 'aw-bibliothek-grid');
    const blocks = bereich('aw-bloecke', 'Inhaltsblöcke');
    const blockList = element('ul', 'aw-liste');
    const visibleBlocks = daten.bloecke.filter(block => passt(zustand.suche,
      block.titel, block.art)).slice(0, MAX_LISTE);
    visibleBlocks.forEach(block => blockList.append(ressourcenZeile(block.icon, block.titel,
      block.art, block.pageId, block.id)));
    blocks.append(visibleBlocks.length ? blockList : leer('Keine Inhaltsblöcke gefunden',
      'Text, Überschriften, Listen und weitere Seitenblöcke erscheinen hier.'));

    const files = bereich('aw-dateien', 'Dateien');
    const fileList = element('ul', 'aw-liste');
    const visibleFiles = daten.dateien.filter(file => passt(zustand.suche, file.titel, file.art))
      .slice(0, MAX_LISTE);
    visibleFiles.forEach(file => fileList.append(ressourcenZeile(file.icon, file.titel,
      `${file.art}${file.dateiId ? ' · lokal gespeichert' : ''}`, file.pageId, file.id)));
    files.append(visibleFiles.length ? fileList : leer('Keine Dateien gefunden',
      'Eingelesene Dateien werden als vorhandene Blöcke angezeigt.', 'import-files', 'Datei einlesen'));

    const pdfs = bereich('aw-pdfs', 'PDFs');
    const pdfList = element('ul', 'aw-liste');
    const visiblePdfs = daten.pdfs.filter(pdf => passt(zustand.suche, pdf.titel)).slice(0, MAX_LISTE);
    visiblePdfs.forEach(pdf => pdfList.append(ressourcenZeile('📕', pdf.titel,
      `${pdf.seiten} ${pdf.seiten === 1 ? 'Seite' : 'Seiten'}`, pdf.pageId)));
    pdfs.append(visiblePdfs.length ? pdfList : leer('Noch keine PDFs',
      'PDF-Seiten erscheinen nach dem Einlesen automatisch.'));

    const boards = bereich('aw-flaechen', 'Whiteboards & Tabellen');
    const boardList = element('ul', 'aw-liste');
    const visibleBoards = daten.flaechen.filter(item => passt(zustand.suche, item.titel, item.art))
      .slice(0, MAX_LISTE);
    visibleBoards.forEach(item => boardList.append(ressourcenZeile(item.icon, item.titel,
      item.art === 'blatt' ? 'Tabelle' : 'Whiteboard', item.pageId, item.id)));
    boards.append(visibleBoards.length ? boardList : leer('Noch keine Arbeitsflächen',
      'Erstelle ein Whiteboard oder eine Tabelle auf einer Seite.', 'new-whiteboard', 'Whiteboard anlegen'));
    grid.append(blocks, files, pdfs, boards); main.append(grid);
  };

  const zeichneAufgaben = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-aufgaben-kopf', 'Aufgaben',
      'Eine Sicht auf Aufgaben-Datenbanken und Todo-Blöcke – ohne Kopien.');
    header.append(sucheKopf(zustand, 'Aufgabe, Status oder Quelle …'));
    main.append(header);
    const offen = daten.aufgaben.filter(task => !task.fertig &&
      passt(zustand.suche, task.titel, task.status, task.quelleName));
    const erledigt = daten.aufgaben.filter(task => task.fertig &&
      passt(zustand.suche, task.titel, task.status, task.quelleName));
    const taskSection = bereich('aw-offene-aufgaben', `Offen (${offen.length})`);
    const taskList = element('ul', 'aw-liste aw-aufgaben-liste');
    offen.slice(0, MAX_LISTE).forEach(task => taskList.append(ressourcenZeile('☐', task.titel,
      `${task.status} · ${task.quelleName}${task.zeit ? ` · ${datumText(task.zeit)}` : ''}`,
      task.quelle === 'datenbank' ? task.id : task.pageId, task.blockId)));
    taskSection.append(offen.length ? taskList : leer('Keine offene Aufgabe',
      'Todo-Blöcke und zugewiesene Datenbankzeilen werden automatisch gesammelt.'));
    main.append(taskSection);
    const doneSection = bereich('aw-erledigte-aufgaben', `Erledigt (${erledigt.length})`);
    const doneList = element('ul', 'aw-liste aw-aufgaben-liste');
    erledigt.slice(0, 30).forEach(task => doneList.append(ressourcenZeile('☑', task.titel,
      `${task.status} · ${task.quelleName}`,
      task.quelle === 'datenbank' ? task.id : task.pageId, task.blockId)));
    doneSection.append(erledigt.length ? doneList : leer('Noch nichts erledigt',
      'Erledigte Einträge bleiben in ihrer ursprünglichen Quelle.'));
    main.append(doneSection);
  };

  const zeichneKalender = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-kalender-kopf', 'Kalender',
      'Alle vorhandenen Datumsfelder aus lesbaren Datenbanken in einer Chronologie.');
    header.append(sucheKopf(zustand, 'Termin, Datenbank oder Datumsfeld …'));
    main.append(header);
    const events = daten.termine.filter(event =>
      passt(zustand.suche, event.titel, event.quelleName, event.feld));
    if (!events.length) {
      main.append(leer('Keine Termine gefunden',
        'Sobald eine Datenbank ein ausgefülltes Datumsfeld hat, erscheint es hier.'));
      return;
    }
    const gruppen = new Map<string, TerminEintrag[]>();
    events.slice(0, MAX_LISTE).forEach(event => {
      const key = new Date(event.zeit).toISOString().slice(0, 10);
      const liste = gruppen.get(key) || []; liste.push(event); gruppen.set(key, liste);
    });
    const timeline = element('div', 'aw-kalender-liste');
    gruppen.forEach((liste, tag) => {
      const day = bereich(`aw-tag-${tag}`, datumText(liste[0]?.zeit || 0));
      const items = element('ul', 'aw-liste');
      liste.forEach(event => items.append(ressourcenZeile('📅', event.titel,
        `${event.quelleName} · ${event.feld}`, event.rowId || event.pageId)));
      day.append(items); timeline.append(day);
    });
    main.append(timeline);
  };

  const zeichneDatenbanken = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-datenbanken-kopf', 'Datenbanken & Ansichten',
      'Jeder Knopf öffnet die echte Datenbank mit ihrer vorhandenen Ansicht.');
    header.append(sucheKopf(zustand, 'Datenbank oder Ansicht …'));
    const neu = aktionsKnopf('▦', 'Neue Datenbank', 'new-database'); header.append(neu); main.append(header);
    const liste = element('div', 'aw-datenbanken');
    const databases = daten.datenbanken.filter(db => passt(zustand.suche, db.name,
      db.ansichten.map(view => `${view.name} ${view.layout}`).join(' ')));
    databases.slice(0, MAX_LISTE).forEach(db => {
      const card = element('article', 'aw-datenbank');
      const top = element('header', 'aw-datenbank-kopf');
      const open = knopf(`${db.icon} ${db.name}`, 'aw-datenbank-oeffnen');
      if (db.pageId) open.dataset.awOpen = db.pageId;
      top.append(open, element('span', 'aw-datenbank-meta', `${db.zeilen} Zeilen · ${db.ansichten.length} Ansichten`));
      card.append(top);
      const views = element('div', 'aw-ansichten'); views.setAttribute('role', 'list');
      db.ansichten.forEach(view => {
        const button = knopf(`${view.icon} ${view.name}`, 'aw-ansicht');
        button.dataset.awCollection = db.id; button.dataset.awView = view.id;
        button.title = `${view.layout}-Ansicht öffnen`; button.setAttribute('role', 'listitem');
        views.append(button);
      });
      card.append(db.ansichten.length ? views : leer('Keine Ansicht',
        'Die Datenbank besitzt zurzeit keine gespeicherte Ansicht.'));
      liste.append(card);
    });
    main.append(databases.length ? liste : leer('Keine Datenbank gefunden',
      'Lege eine Datenbank an; ihre Ansichten erscheinen hier automatisch.',
      'new-database', 'Datenbank anlegen'));
  };

  /* ==========================================================================
   * WHITEBOARDS ALS EIGENER ARBEITSBEREICH (E138, Auftrag §22)
   * --------------------------------------------------------------------------
   * Die Flächen lagen schon im Schnappschuss — sichtbar waren sie nur als
   * eine Zeile in der Übersicht, zusammen mit den Tabellen. §22 verlangt
   * einen eigenen Top-Level-Bereich; §52 verbietet dafür eine zweite
   * Datenhaltung. Beides zusammen heisst: EIN Reiter mehr auf denselben
   * Daten, und die Vorschau liest den Block, den es ohnehin schon gibt.
   * ========================================================================*/

  /** Ein kleines Abbild der Fläche — dieselben Formen, nur klein und ohne
      Bedienung. Ohne Vorschau sähen zehn Whiteboards gleich aus, und man
      müsste jedes öffnen, um seines zu finden. */
  const MINIATUR_FORMEN = 60;
  const miniatur = (blockId: string): SVGSVGElement | null => {
    const block = typeof Store.getBlock === 'function' ? Store.getBlock(blockId) : null;
    const formen: any[] = Array.isArray(block?.shapes) ? block.shapes : [];
    const sichtbar = formen.filter(form => form && form.art !== 'verbindung').slice(0, MINIATUR_FORMEN);
    if (!sichtbar.length) return null;
    const rahmen = sichtbar.map(form => {
      if (form.art === 'stift' && Array.isArray(form.pts) && form.pts.length) {
        const xs = form.pts.map((punkt: any) => Number(punkt?.[0]) || 0);
        const ys = form.pts.map((punkt: any) => Number(punkt?.[1]) || 0);
        return { x: Math.min(...xs), y: Math.min(...ys),
                 w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
      }
      const x = Number(form.x) || 0, y = Number(form.y) || 0;
      const w = Number(form.w) || 0, h = Number(form.h) || 0;
      return { x: Math.min(x, x + w), y: Math.min(y, y + h), w: Math.abs(w) || 40, h: Math.abs(h) || 20 };
    });
    const x1 = Math.min(...rahmen.map(r => r.x)) - 8;
    const y1 = Math.min(...rahmen.map(r => r.y)) - 8;
    const x2 = Math.max(...rahmen.map(r => r.x + r.w)) + 8;
    const y2 = Math.max(...rahmen.map(r => r.y + r.h)) + 8;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'aw-board-bild');
    svg.setAttribute('viewBox', `${x1} ${y1} ${Math.max(1, x2 - x1)} ${Math.max(1, y2 - y1)}`);
    svg.setAttribute('aria-hidden', 'true');
    sichtbar.forEach((form, index) => {
      const farbe = String(form.farbe || '#9b9a97');
      const kasten = rahmen[index]!;
      if (form.art === 'stift' && Array.isArray(form.pts) && form.pts.length > 1) {
        const pfad = document.createElementNS(ns, 'path');
        pfad.setAttribute('d', 'M' + form.pts.map((punkt: any) =>
          `${Number(punkt?.[0]) || 0} ${Number(punkt?.[1]) || 0}`).join(' L'));
        pfad.setAttribute('stroke', farbe); pfad.setAttribute('fill', 'none');
        pfad.setAttribute('stroke-width', '3'); pfad.setAttribute('stroke-linecap', 'round');
        svg.append(pfad); return;
      }
      if (form.art === 'linie' || form.art === 'pfeil') {
        const linie = document.createElementNS(ns, 'path');
        linie.setAttribute('d', `M${Number(form.x) || 0} ${Number(form.y) || 0} ` +
          `L${(Number(form.x) || 0) + (Number(form.w) || 0)} ${(Number(form.y) || 0) + (Number(form.h) || 0)}`);
        linie.setAttribute('stroke', farbe); linie.setAttribute('fill', 'none');
        linie.setAttribute('stroke-width', '3');
        svg.append(linie); return;
      }
      if (form.art === 'ellipse') {
        const kreis = document.createElementNS(ns, 'ellipse');
        kreis.setAttribute('cx', String(kasten.x + kasten.w / 2));
        kreis.setAttribute('cy', String(kasten.y + kasten.h / 2));
        kreis.setAttribute('rx', String(Math.max(1, kasten.w / 2)));
        kreis.setAttribute('ry', String(Math.max(1, kasten.h / 2)));
        kreis.setAttribute('fill', 'none'); kreis.setAttribute('stroke', farbe);
        kreis.setAttribute('stroke-width', '3');
        svg.append(kreis); return;
      }
      const feld = document.createElementNS(ns, 'rect');
      feld.setAttribute('x', String(kasten.x)); feld.setAttribute('y', String(kasten.y));
      feld.setAttribute('width', String(Math.max(1, kasten.w)));
      feld.setAttribute('height', String(Math.max(1, kasten.h)));
      feld.setAttribute('rx', '4');
      feld.setAttribute('fill', form.art === 'notiz' ? farbe : 'none');
      feld.setAttribute('fill-opacity', form.art === 'notiz' ? '.7' : '1');
      feld.setAttribute('stroke', farbe); feld.setAttribute('stroke-width', '3');
      svg.append(feld);
    });
    return svg;
  };

  const zeichneWhiteboards = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-boards-kopf', 'Whiteboards',
      'Freie Flächen auf denselben Seiten: schieben, zoomen, Formen verbinden. ' +
      'Ein Whiteboard ist ein Block auf einer normalen Seite – keine zweite Datenhaltung.');
    header.append(sucheKopf(zustand, 'Whiteboard oder Seite …'));
    const neu = aktionsKnopf('＋', 'Neues Whiteboard', 'new-whiteboard');
    header.append(neu);
    main.append(header);

    const boards = daten.flaechen.filter(item => item.art === 'whiteboard' &&
      passt(zustand.suche, item.titel));
    if (!boards.length) {
      main.append(leer('Noch kein Whiteboard',
        'Ein Whiteboard ist eine freie Fläche für Skizzen, Haftnotizen und Verbindungen. ' +
        'Es entsteht als Block auf einer normalen Seite und wandert damit in Sicherung, Suche und Freigabe mit.',
        'new-whiteboard', 'Whiteboard anlegen'));
      return;
    }
    const liste = element('div', 'aw-boards');
    boards.slice(0, MAX_LISTE).forEach(board => {
      const karte = element('article', 'aw-board');
      const oeffnen = knopf('', 'aw-board-oeffnen');
      oeffnen.dataset.awBlock = board.id;
      const bild = miniatur(board.id);
      if (bild) oeffnen.append(bild);
      else oeffnen.append(element('span', 'aw-board-leer', '🖍'));
      oeffnen.append(element('strong', 'aw-board-titel', board.titel));
      oeffnen.append(element('small', 'aw-board-meta',
        `${board.formen} ${board.formen === 1 ? 'Form' : 'Formen'} · ${datumText(board.bearbeitet)}`));
      karte.append(oeffnen);
      const aktionen = element('span', 'aw-board-aktionen');
      const reiter = knopf('↗', 'aw-mini'); reiter.title = 'In neuem Reiter öffnen';
      reiter.dataset.awOpenTab = board.pageId;
      const geteilt = knopf('⊞', 'aw-mini'); geteilt.title = 'Geteilt öffnen';
      geteilt.dataset.awSplit = board.pageId;
      aktionen.append(reiter, geteilt);
      karte.append(aktionen);
      liste.append(karte);
    });
    main.append(liste);
  };

  const zeichneWiki = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-wiki-kopf', 'Wiki, Aliasse & Rückverweise',
      'Die Kennzahlen werden aus vorhandenen [[Seitenlinks]] und Aliasfeldern abgeleitet.');
    header.append(sucheKopf(zustand, 'Wiki-Seite oder Alias …')); main.append(header);
    const wiki = daten.wiki.filter(page => passt(zustand.suche, page.titel,
      page.aliases.join(' '), page.pfad));
    const list = element('div', 'aw-wiki-liste');
    wiki.slice(0, MAX_LISTE).forEach(page => {
      const article = element('article', 'aw-wiki-eintrag');
      const open = knopf(`${page.icon} ${page.titel}`, 'aw-wiki-oeffnen'); open.dataset.awOpen = page.id;
      const meta = element('p', 'aw-wiki-meta',
        `${page.backlinkAnzahl} Rückverweise · ${page.aliases.length} Aliasse`);
      article.append(open, meta);
      if (page.aliases.length) {
        const aliases = element('ul', 'aw-aliasse'); aliases.setAttribute('aria-label', 'Aliasse');
        page.aliases.forEach(alias => aliases.append(element('li', 'aw-alias', alias)));
        article.append(aliases);
      }
      list.append(article);
    });
    main.append(wiki.length ? list : leer('Noch kein Wissensnetz',
      'Wiki-Seiten, Aliasse und Rückverweise erscheinen hier, sobald sie im Bestand vorkommen.'));
  };

  const zeichneVorlagen = (main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand): void => {
    const header = bereich('aw-vorlagen-kopf', 'Vorlagen',
      'Vorlagen erzeugen normale Seiten und Datenbanken über das vorhandene Vorlagenregister.');
    header.append(sucheKopf(zustand, 'Vorlage oder Beschreibung …')); main.append(header);
    const templates = daten.vorlagen.filter(template => passt(zustand.suche,
      template.name, template.text, template.quelle));
    const list = element('div', 'aw-vorlagen');
    templates.slice(0, MAX_LISTE).forEach(template => {
      const card = element('article', 'aw-vorlage');
      card.append(element('span', 'aw-vorlage-icon', template.icon),
        element('h2', 'aw-vorlage-name', template.name),
        element('p', 'aw-vorlage-text', template.text));
      if (template.quelle) card.append(element('small', 'aw-vorlage-quelle', template.quelle));
      const use = knopf('Vorlage einsetzen', 'aw-vorlage-nutzen'); use.dataset.awTemplate = template.id;
      card.append(use); list.append(card);
    });
    main.append(templates.length ? list : leer('Keine Vorlage gefunden',
      'Öffne die vollständige Galerie oder ändere den Suchbegriff.', 'template-gallery', 'Galerie öffnen'));
  };

  const zeichneHauptinhalt = (
    main: HTMLElement, daten: ArbeitsweltSnapshot, zustand: Zustand
  ): void => {
    if (zustand.ansicht === 'bibliothek') { zeichneBibliothek(main, daten, zustand); return; }
    if (zustand.ansicht === 'aufgaben') { zeichneAufgaben(main, daten, zustand); return; }
    if (zustand.ansicht === 'kalender') { zeichneKalender(main, daten, zustand); return; }
    if (zustand.ansicht === 'datenbanken') { zeichneDatenbanken(main, daten, zustand); return; }
    if (zustand.ansicht === 'whiteboards') { zeichneWhiteboards(main, daten, zustand); return; }
    if (zustand.ansicht === 'wiki') { zeichneWiki(main, daten, zustand); return; }
    if (zustand.ansicht === 'vorlagen') { zeichneVorlagen(main, daten, zustand); return; }
    zeichneUebersicht(main, daten, zustand);
  };

  const zeichneReiter = (aside: HTMLElement, vertrag: ReiterVertrag): void => {
    const status = vertrag.lesen();
    const title = element('h2', 'aw-reiter-titel', 'Reiter & geteilte Ansicht');
    aside.append(title);
    if (!status.verfuegbar) {
      aside.append(element('p', 'aw-reiter-hinweis', 'Die Fenstersteuerung ist noch nicht geladen.'));
      return;
    }
    const list = element('ul', 'aw-reiter-liste'); list.setAttribute('role', 'tablist');
    status.reiter.forEach((tab, index) => {
      const item = element('li', 'aw-reiter');
      const open = knopf(tab.titel, 'aw-reiter-wechsel'); open.dataset.awTab = String(index);
      open.setAttribute('role', 'tab'); open.setAttribute('aria-selected', String(tab.aktiv));
      const split = knopf('⊞', 'aw-mini'); split.dataset.awSplit = tab.id; split.title = 'Geteilt öffnen';
      const close = knopf('✕', 'aw-mini'); close.dataset.awTabClose = String(index); close.title = 'Reiter schliessen';
      item.append(open, split, close); list.append(item);
    });
    aside.append(status.reiter.length ? list : element('p', 'aw-reiter-hinweis', 'Noch kein Seitenreiter offen.'));
    if (status.geteilt) {
      const split = element('div', 'aw-teilung');
      const page = Store.getBlock(status.geteilt.id);
      split.append(element('span', 'aw-teilung-text',
        `Geteilt: ${page?.text || 'Ohne Titel'} · ${status.geteilt.richtung}`));
      const close = knopf('Teilung schliessen', 'aw-teilung-schliessen'); close.dataset.awSplitClose = 'true';
      split.append(close); aside.append(split);
    }
  };

  const controllerBauen = (root: HTMLElement, startAnsicht: unknown): Controller => {
    const id = `aw-${++instanz}`;
    const startBereiche = bereichDefinitionen();
    const zustand: Zustand = { ansicht: normalisiereAnsicht(startAnsicht), suche: '',
      bereichId: gemerkterBereich(startBereiche),
      mobileNavigationOffen: false };
    let daten = snapshot(zustand.bereichId);
    const media = typeof matchMedia === 'function' ? matchMedia('(max-width: 760px)') : null;
    const reiter = reiterVertrag();

    const zeichnen = (): void => {
      root.classList.add('produkt-welt', 'arbeitswelt');
      const shell = element('div', 'aw-shell');
      const header = element('header', 'aw-kopf');
      const titleBox = element('div', 'aw-titelgruppe');
      titleBox.append(element('p', 'aw-eyebrow', 'Redion Hauptwelt'),
        element('h1', 'aw-titel', TITEL),
        element('p', 'aw-untertitel', 'Seiten, Wissen, Dateien und Arbeit in einer gemeinsamen Sicht.'));
      const mobile = knopf('Bereiche', 'aw-mobile-nav'); mobile.dataset.awMobileNav = 'true';
      mobile.setAttribute('aria-controls', `${id}-nav`);
      mobile.setAttribute('aria-expanded', String(zustand.mobileNavigationOffen));
      header.append(titleBox, bereichAuswahl(daten, zustand, id), mobile); shell.append(header);

      const layout = element('div', 'aw-layout');
      const nav = element('nav', 'aw-navigation'); nav.id = `${id}-nav`;
      nav.setAttribute('aria-label', 'Workspace-Bereiche');
      if (media?.matches && !zustand.mobileNavigationOffen) nav.hidden = true;
      ansichten.forEach(ansicht => {
        const button = knopf(`${ansicht.icon} ${ansicht.name}`, 'aw-navigation-eintrag');
        button.dataset.awSection = ansicht.id;
        if (ansicht.id === zustand.ansicht) button.setAttribute('aria-current', 'page');
        nav.append(button);
      });
      layout.append(nav);

      const main = element('main', 'aw-inhalt'); main.id = `${id}-inhalt`;
      main.tabIndex = -1; zeichneHauptinhalt(main, daten, zustand); layout.append(main);
      const aside = element('aside', 'aw-reiter-panel');
      aside.setAttribute('aria-label', 'Offene Seiten und geteilte Ansicht');
      zeichneReiter(aside, reiter); layout.append(aside);
      shell.append(layout); root.replaceChildren(shell);
    };

    const oeffneSeite = (pageId: string): void => {
      const page = Store.getBlock(pageId);
      const darfLesen = page?.parentTable === 'collection'
        ? sammlungErlaubt('lesen', String(page.parentId || ''))
        : !!page && erlaubt('lesen', page.id);
      if (!page || !darfLesen) {
        hinweis('Diese Seite ist nicht verfügbar.'); return;
      }
      App.oeffne(pageId);
    };

    const oeffneBlock = (blockId: string): void => {
      const block = Store.getBlock(blockId), page = seiteVonBlock(block);
      if (!block || !page || !erlaubt('lesen', page.id)) {
        hinweis('Dieser Block ist nicht verfügbar.'); return;
      }
      if (typeof App.zeigeBlock === 'function') App.zeigeBlock(blockId);
      else App.oeffne(page.id);
    };

    const oeffneDatenbankAnsicht = (collectionId: string, viewId: string): void => {
      if (!sammlungErlaubt('lesen', collectionId)) {
        hinweis('Diese Datenbank ist nicht verfügbar.'); return;
      }
      const kontext = datenbankKontext(collectionId);
      const view = typeof Store.getView === 'function' ? Store.getView(viewId) : null;
      if (!kontext.page || !view || String(view.collectionId) !== collectionId) {
        hinweis('Diese Ansicht gibt es nicht mehr.'); return;
      }
      if (kontext.block && sammlungErlaubt('bearbeiten', collectionId))
        Store.updateBlock(kontext.block.id, { aktiveView: viewId });
      App.oeffne(kontext.page.id);
    };

    const vorlageEinsetzen = (templateId: string): void => {
      if (!erlaubt('bearbeiten')) { hinweis('Du darfst keine Vorlage einsetzen.'); return; }
      const page = typeof Register !== 'undefined' && Register.vorlagen?.bauen
        ? Register.vorlagen.bauen(templateId)
        : (typeof Galerie !== 'undefined' && typeof Galerie.bauen === 'function'
            ? Galerie.bauen(templateId) : null);
      if (!page) { hinweis('Die Vorlage konnte nicht eingesetzt werden.'); return; }
      if (typeof App.zeichneBaum === 'function') App.zeichneBaum();
      if (page.id) App.oeffne(page.id);
    };

    const aktion = (name: string): void => {
      if (name === 'apply-search') {
        daten = snapshot(zustand.bereichId); zustand.bereichId = daten.bereichId; zeichnen(); return;
      }
      if (name === 'clear-search') { zustand.suche = ''; zeichnen(); return; }
      if (name === 'show-templates') { zustand.ansicht = 'vorlagen'; zeichnen(); return; }
      if (name === 'template-gallery') {
        if (typeof Galerie !== 'undefined' && typeof Galerie.oeffne === 'function') Galerie.oeffne();
        else { zustand.ansicht = 'vorlagen'; zeichnen(); }
        return;
      }
      if (name === 'global-search') {
        if (typeof Werkzeuge !== 'undefined' && typeof Werkzeuge.palette === 'function')
          Werkzeuge.palette(zustand.suche || undefined);
        else if (typeof App.suche === 'function') App.suche();
        return;
      }
      if (name === 'new-page') {
        if (!erlaubt('bearbeiten')) { hinweis('Du darfst keine Seite anlegen.'); return; }
        App.neueSeite(); return;
      }
      if (name === 'new-database') {
        if (!erlaubt('bearbeiten')) { hinweis('Du darfst keine Datenbank anlegen.'); return; }
        const page = Store.addPage(null, { text: 'Neue Datenbank', icon: '🗂️' });
        Store.addDatabase(page.id, 'Neue Datenbank');
        if (typeof App.zeichneBaum === 'function') App.zeichneBaum();
        App.oeffne(page.id); return;
      }
      if (name === 'new-whiteboard') {
        if (!erlaubt('bearbeiten')) { hinweis('Du darfst kein Whiteboard anlegen.'); return; }
        const page = Store.addPage(null, { text: 'Neues Whiteboard', icon: '🎨' });
        Store.addBlock(page.id, 'whiteboard', { text: 'Whiteboard' });
        if (typeof App.zeichneBaum === 'function') App.zeichneBaum();
        App.oeffne(page.id); return;
      }
      if (name === 'import-files') {
        if (!erlaubt('bearbeiten')) { hinweis('Du darfst keine Dateien einlesen.'); return; }
        if (typeof Werkzeuge !== 'undefined' && typeof Werkzeuge.dateienLesen === 'function')
          Werkzeuge.dateienLesen();
        return;
      }
      if (name === 'capture') {
        if (!erlaubt('bearbeiten')) { hinweis('Du darfst nichts erfassen.'); return; }
        if (typeof Recognition !== 'undefined' && typeof Recognition.scan === 'function') Recognition.scan();
        return;
      }
      if (name === 'backup') {
        if (typeof App.sicherungSpeichern === 'function') App.sicherungSpeichern();
      }
    };

    const click = (event: Event): void => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const mobile = target.closest<HTMLElement>('[data-aw-mobile-nav]');
      if (mobile) { zustand.mobileNavigationOffen = !zustand.mobileNavigationOffen; zeichnen(); return; }
      const section = target.closest<HTMLElement>('[data-aw-section]');
      if (section?.dataset.awSection) {
        zustand.ansicht = normalisiereAnsicht(section.dataset.awSection);
        zustand.mobileNavigationOffen = false; zeichnen(); return;
      }
      const template = target.closest<HTMLElement>('[data-aw-template]');
      if (template?.dataset.awTemplate) { vorlageEinsetzen(template.dataset.awTemplate); return; }
      const dbView = target.closest<HTMLElement>('[data-aw-collection][data-aw-view]');
      if (dbView?.dataset.awCollection && dbView.dataset.awView) {
        oeffneDatenbankAnsicht(dbView.dataset.awCollection, dbView.dataset.awView); return;
      }
      const block = target.closest<HTMLElement>('[data-aw-block]');
      if (block?.dataset.awBlock) { oeffneBlock(block.dataset.awBlock); return; }
      const tabOpen = target.closest<HTMLElement>('[data-aw-open-tab]');
      if (tabOpen?.dataset.awOpenTab) { reiter.oeffnen(tabOpen.dataset.awOpenTab); return; }
      const split = target.closest<HTMLElement>('[data-aw-split]');
      if (split?.dataset.awSplit) { reiter.teilen(split.dataset.awSplit); return; }
      const tabClose = target.closest<HTMLElement>('[data-aw-tab-close]');
      if (tabClose?.dataset.awTabClose) { reiter.schliessen(Number(tabClose.dataset.awTabClose)); return; }
      const tab = target.closest<HTMLElement>('[data-aw-tab]');
      if (tab?.dataset.awTab) { reiter.wechseln(Number(tab.dataset.awTab)); return; }
      if (target.closest('[data-aw-split-close]')) { reiter.teilungSchliessen(); zeichnen(); return; }
      const open = target.closest<HTMLElement>('[data-aw-open]');
      if (open?.dataset.awOpen) { oeffneSeite(open.dataset.awOpen); return; }
      const action = target.closest<HTMLElement>('[data-aw-action]');
      if (action?.dataset.awAction) aktion(action.dataset.awAction);
    };

    const input = (event: Event): void => {
      const target = event.target instanceof HTMLInputElement ? event.target : null;
      if (target?.dataset.awQuery) zustand.suche = target.value;
    };

    const bereichSetzen = (wert: unknown): void => {
      const bereichId = normalisiereBereichId(wert, bereichDefinitionen());
      zustand.bereichId = bereichId;
      bereichMerken(bereichId);
      daten = snapshot(bereichId);
      zustand.bereichId = daten.bereichId;
      zeichnen();
    };

    const change = (event: Event): void => {
      const target = event.target instanceof HTMLSelectElement ? event.target : null;
      if (target?.dataset.awBereich) bereichSetzen(target.value);
    };

    const submit = (event: Event): void => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form?.dataset.awSearchForm) return;
      event.preventDefault(); daten = snapshot(zustand.bereichId);
      zustand.bereichId = daten.bereichId; zeichnen();
    };

    const mediaGeaendert = (): void => {
      if (!media?.matches) zustand.mobileNavigationOffen = false;
      zeichnen();
    };

    const controller: Controller = {
      root,
      zustand: () => ({ ...zustand }),
      snapshot: () => daten,
      ansichtSetzen: (ansicht: unknown): void => {
        zustand.ansicht = normalisiereAnsicht(ansicht); zustand.mobileNavigationOffen = false; zeichnen();
      },
      sucheSetzen: (text: unknown): void => { zustand.suche = String(text || ''); zeichnen(); },
      bereichSetzen,
      aktualisieren: (): void => {
        daten = snapshot(zustand.bereichId); zustand.bereichId = daten.bereichId; zeichnen();
      },
      oeffneSeite, oeffneBlock, oeffneDatenbankAnsicht, reiter,
      zerstoeren: (): void => {
        root.removeEventListener('click', click);
        root.removeEventListener('input', input);
        root.removeEventListener('change', change);
        root.removeEventListener('submit', submit);
        media?.removeEventListener('change', mediaGeaendert);
        if (controllerNachRoot.get(root) === controller) controllerNachRoot.delete(root);
        root.replaceChildren(); root.classList.remove('produkt-welt', 'arbeitswelt');
      }
    };

    root.addEventListener('click', click);
    root.addEventListener('input', input);
    root.addEventListener('change', change);
    root.addEventListener('submit', submit);
    media?.addEventListener('change', mediaGeaendert);
    zeichnen();
    return controller;
  };

  /** Setzt die Workspace-Welt in ein vorhandenes Schalen-Ziel ein. */
  const render = (ziel: HTMLElement, ansicht: unknown = 'uebersicht'): Controller => {
    controllerNachRoot.get(ziel)?.zerstoeren();
    const controller = controllerBauen(ziel, ansicht);
    controllerNachRoot.set(ziel, controller);
    return controller;
  };

  /** Öffnet die Workspace-Welt als bestehende Redion-Sonderansicht. */
  const oeffnen = (ansicht: unknown = 'uebersicht'): Controller | null => {
    if (typeof App === 'undefined' || typeof App.zeigeSonder !== 'function') return null;
    let controller: Controller | null = null;
    App.zeigeSonder(TITEL, (ziel: HTMLElement) => { controller = render(ziel, ansicht); });
    return controller;
  };

  return {
    TITEL, ansichten, render, oeffnen, open: oeffnen, mount: render,
    snapshot, reiterVertrag, controller: render
  };
})();

(window as any).Arbeitswelt = Arbeitswelt;
