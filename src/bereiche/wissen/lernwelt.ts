/* ============================================================================
 * bereiche/wissen/lernwelt.ts — die Hauptwelt „Lernen & Alltag"
 * ----------------------------------------------------------------------------
 * Diese Datei ist absichtlich eine Sicht auf den bestehenden Redion-Bestand:
 * Seiten, Datenbankzeilen, PDFs, Aufgaben und Lernkarten bleiben ihre
 * kanonischen Objekte. Auch das Heute-Dashboard legt beim Zeichnen nichts an.
 *
 * `Lebensbereiche` wird nur über einen defensiven Adapter angesprochen. So
 * kann dieser Baustein vor oder nach dem Bereichsmodul geladen werden und
 * bleibt mit Beständen kompatibel, die noch keine Zuordnungen besitzen.
 * ==========================================================================*/

type LernweltAnsicht =
  | 'heute'
  | 'lernen'
  | 'lernweg'
  | 'fehler'
  | 'pruefungen'
  | 'schule'
  | 'uni'
  | 'arbeit'
  | 'fortschritt';

type LernweltBereich = {
  id: string;
  name: string;
  icon: string;
  art: string;
};

type LernweltAufgabe = {
  id: string;
  titel: string;
  datum: string;
  fertig: boolean;
  quelle: string;
  bereichIds: string[];
};

type LernweltTermin = {
  id: string;
  titel: string;
  datum: Date;
  quelle: string;
  bereichIds: string[];
};

type LernweltEintrag = {
  id: string;
  titel: string;
  icon: string;
  zeit: string;
  untertitel: string;
  bereichIds: string[];
};

type LernweltPruefung = {
  id: string;
  collectionId: string;
  titel: string;
  datum: Date | null;
  tage: number | null;
  fach: string;
  lernstoff: string;
  dauer: number;
  status: string;
  bereichIds: string[];
};

type LernweltFehler = {
  card: any;
  frage: string;
  antwort: string;
  letzteAntwort: string;
  fach: string;
  thema: string;
  quelle: string;
  anzahl: number;
  zuletzt: string;
  naechste: string;
  stabil: boolean;
};

type LernweltSimulationAntwort = {
  cardId: string;
  richtig: boolean;
  thema: string;
};

type LernweltSimulation = {
  titel: string;
  karten: any[];
  index: number;
  aufgedeckt: boolean;
  gestartet: number;
  endet: number;
  antworten: LernweltSimulationAntwort[];
  fertig: boolean;
};

type LernweltTraining = {
  titel: string;
  karten: any[];
  index: number;
  aufgedeckt: boolean;
  bewertet: number;
  beschaeftigt: boolean;
};

type LernweltExterneDaten = {
  heute: any;
  aufgaben: any[];
  termine: any[];
  zuletzt: any[];
  projekte: any[];
  pdfs: any[];
  lernkarten: any[];
};

type LernweltZustand = {
  root: HTMLElement | null;
  ansicht: LernweltAnsicht;
  bereichId: string;
  fachId: string;
  themaId: string;
  training: LernweltTraining | null;
  simulation: LernweltSimulation | null;
  extern: LernweltExterneDaten | null;
  ladeSchluessel: string;
  generation: number;
  timer: number | null;
};

const Lernwelt = (() => {
  const ANSICHTEN: Array<{ id: LernweltAnsicht; icon: string; name: string }> = [
    { id: 'heute', icon: '☀️', name: 'Heute' },
    { id: 'lernen', icon: '🎴', name: 'Lernen' },
    { id: 'lernweg', icon: '🧭', name: 'Lernpfad' },
    { id: 'fehler', icon: '🧩', name: 'Meine Fehler' },
    { id: 'pruefungen', icon: '📝', name: 'Prüfungen' },
    { id: 'schule', icon: '🎓', name: 'Schule / Ausbildung' },
    { id: 'uni', icon: '🏛️', name: 'Uni' },
    { id: 'arbeit', icon: '💼', name: 'Arbeit' },
    { id: 'fortschritt', icon: '📈', name: 'Fortschritt' }
  ];

  const zustand: LernweltZustand = {
    root: null,
    ansicht: 'heute',
    bereichId: 'alle',
    fachId: '',
    themaId: '',
    training: null,
    simulation: null,
    extern: null,
    ladeSchluessel: '',
    generation: 0,
    timer: null
  };

  const esc = (wert: unknown): string => String(wert ?? '')
    .replace(/[&<>\"]/g, zeichen =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' } as Record<string, string>)[zeichen] ?? zeichen);

  const zahl = (wert: unknown, rueckfall = 0): number => {
    const ausgabe = Number(wert);
    return Number.isFinite(ausgabe) ? ausgabe : rueckfall;
  };

  const liste = (wert: unknown): any[] => Array.isArray(wert) ? wert : [];

  const objektWerte = (wert: unknown): any[] => {
    if (Array.isArray(wert)) return wert.filter(Boolean);
    if (wert && typeof wert === 'object') return Object.values(wert as Record<string, unknown>).filter(Boolean);
    return [];
  };

  const textListe = (wert: unknown): string[] => {
    if (Array.isArray(wert)) return wert.map(String).map(text => text.trim()).filter(Boolean);
    const text = String(wert ?? '').trim();
    if (!text) return [];
    return text.split(/[,;|\n]/).map(teil => teil.trim()).filter(Boolean);
  };

  const datum = (wert: unknown): Date | null => {
    /* EIN `Date` IST SCHON EIN DATUM (E135).
       Hier stand nur der Hüllen-Zweig: „ist es ein Objekt, dann lies `.start`,
       `.date` oder `.from`". Ein `Date` IST ein Objekt und hat keines dieser
       drei Felder — also war `roh` undefined und die Funktion gab `null`
       zurück. Jeder Aufruf mit einem echten Datum lief ins Leere, und weil
       `tag()`, `datumText()` und `tageBis()` alle darüber gehen, nahm das
       halbe Dashboard es mit:

           tag(new Date())        ''      → „heute" traf nie zu
           Lernziel heute         0 / 20  → bewegte sich nie
           Streak                 0       → auch nach dem Lernen
           Verlaufsbalken         leer    → 7 und 30 Tage
           Prüfungs-Countdown     null    → auf dem Schirm stand „null Tage"

       Eine Zeile, fünf falsche Zahlen — und keine davon sah nach einem
       Fehler aus, weil 0 und „leer" plausible Werte für einen frischen
       Bestand sind. Genau diese Sorte findet kein Prüflauf von selbst. */
    if (wert instanceof Date)
      return Number.isFinite(wert.getTime()) ? wert : null;
    const roh = wert && typeof wert === 'object'
      ? (wert as any).start ?? (wert as any).date ?? (wert as any).from
      : wert;
    if (!roh) return null;
    const ausgabe = new Date(roh as any);
    return Number.isFinite(ausgabe.getTime()) ? ausgabe : null;
  };

  const tagesStart = (wert: Date = new Date()): Date => {
    const ausgabe = new Date(wert);
    ausgabe.setHours(0, 0, 0, 0);
    return ausgabe;
  };

  const tag = (wert: unknown): string => {
    const d = datum(wert);
    if (!d) return '';
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')].join('-');
  };

  const datumText = (wert: unknown, mitZeit = false): string => {
    const d = datum(wert);
    if (!d) return 'ohne Termin';
    return d.toLocaleDateString('de-CH', mitZeit
      ? { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const relativText = (wert: unknown): string => {
    const d = datum(wert);
    if (!d) return '';
    const minuten = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    if (minuten < 1) return 'gerade eben';
    if (minuten < 60) return 'vor ' + minuten + ' Min.';
    if (minuten < 1440) return 'vor ' + Math.floor(minuten / 60) + ' Std.';
    return 'vor ' + Math.floor(minuten / 1440) + ' Tagen';
  };

  const tageBis = (wert: unknown): number | null => {
    const d = datum(wert);
    if (!d) return null;
    const heute = tagesStart();
    const ziel = tagesStart(d);
    return Math.round((ziel.getTime() - heute.getTime()) / 86400000);
  };

  const lebensbereiche = (): any => {
    const api = (window as any).Lebensbereiche;
    return api && typeof api === 'object' ? api : null;
  };

  const aktor = (): { id: string; name: string } => {
    try {
      const api = lebensbereiche();
      const person = api?.lernzustand?.aktuellerAktor?.();
      if (typeof person === 'string' && person) {
        const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
        return { id: person, name: String(konto?.name || 'Ich') };
      }
      if (person?.id) return { id: String(person.id), name: String(person.name || 'Ich') };
      const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
      return { id: String(konto?.id || 'lokal'), name: String(konto?.name || 'Ich') };
    } catch {
      return { id: 'lokal', name: 'Ich' };
    }
  };

  const metaSchluessel = (name: string): string => 'lernwelt:' + aktor().id + ':' + name;

  const bereiche = (): LernweltBereich[] => {
    let roh: any[] = [];
    try {
      const api = lebensbereiche();
      if (api && typeof api.auflisten === 'function') roh = liste(api.auflisten());
    } catch { roh = []; }
    const normalisiert = roh.map((eintrag: any): LernweltBereich => ({
      id: String(eintrag?.id || ''),
      name: String(eintrag?.name || eintrag?.titel || 'Bereich'),
      icon: String(eintrag?.icon || eintrag?.symbol || '◉'),
      art: String(eintrag?.art || eintrag?.typ || '').toLowerCase()
    })).filter((eintrag: LernweltBereich) => eintrag.id);
    return [{ id: 'alle', name: 'Alle Bereiche', icon: '◎', art: 'alle' }, ...normalisiert];
  };

  const direkteBereichIds = (record: any): string[] => {
    if (!record) return [];
    try {
      const api = lebensbereiche();
      if (api && typeof api.direkteBereichIds === 'function')
        return textListe(api.direkteBereichIds(record));
    } catch { /* die lokalen Felder darunter bleiben der Rückfall */ }
    const direkt = record.bereichIds ?? record.lebensbereiche ?? record.bereiche ?? record.bereich;
    return textListe(direkt);
  };

  const seiteVon = (record: any): any => {
    if (!record) return null;
    if (record.type === 'page') return record;
    if (record.parentTable === 'collection') {
      const ansichten = Object.values<any>(Store.cache.blocks).filter(block =>
        block?.alive !== false && block.type === 'database' && block.collectionId === record.parentId);
      const block = ansichten.find(item => !item.verknuepft) || ansichten[0];
      if (block && typeof Links !== 'undefined' && Links.seiteVon) return Links.seiteVon(block.id);
    }
    if (typeof Links !== 'undefined' && Links.seiteVon && record.id) return Links.seiteVon(record.id);
    let aktuell = record;
    for (let tiefe = 0; tiefe < 40 && aktuell?.parentId; tiefe++) {
      aktuell = Store.getBlock(aktuell.parentId);
      if (aktuell?.type === 'page') return aktuell;
    }
    return null;
  };

  const darfLesen = (record: any): boolean => {
    if (!record || record.alive === false) return false;
    if (typeof Konten === 'undefined' || !Konten.darf) return true;
    const seite = seiteVon(record);
    return !!seite && !!Store.getBlock(seite.id) && Konten.darf('lesen', seite.id);
  };

  const imBereich = (record: any, bereichId = zustand.bereichId): boolean => {
    if (!record || bereichId === 'alle') return true;
    if (direkteBereichIds(record).includes(bereichId)) return true;
    const seite = seiteVon(record);
    return !!seite && seite !== record && direkteBereichIds(seite).includes(bereichId);
  };

  const alleBloecke = (): any[] => Object.values<any>(Store.cache.blocks)
    .filter(block => block?.alive !== false && darfLesen(block));

  const lernkartenRoh = (): any[] => {
    const ausLearning = typeof Learning !== 'undefined' && Learning.cards ? liste(Learning.cards()) : [];
    return ausLearning.filter(card => imBereich(card));
  };

  /** Nur der referenzielle Store-Vertrag darf eine Nur-Lese-Karte bewerten. */
  const hatExternenLernvertrag = (api: any): boolean => {
    const lernzustand = api?.lernzustand, vertrag = lernzustand?.VERTRAG;
    return typeof lernzustand?.lesen === 'function' &&
      typeof lernzustand?.schreiben === 'function' &&
      Number(vertrag?.version) >= 2 &&
      vertrag?.speicher === 'store-meta' &&
      vertrag?.inhaltUnveraendert === true;
  };

  const persoenlicherStand = (card: any): any => {
    try {
      const api = lebensbereiche();
      if (api?.lernzustand && typeof api.lernzustand.lesen === 'function')
        return api.lernzustand.lesen(card, aktor().id);
    } catch { /* der alte Kartenstand bleibt lesbar */ }
    return {
      version: 1,
      cardId: String(card?.id || ''),
      actorId: aktor().id,
      algorithm: 'sm2',
      sr: card?.sr || null,
      reviewVerlauf: card?.reviewVerlauf || {},
      quelle: card?.sr || card?.reviewVerlauf ? 'legacy' : 'leer',
      updatedAt: String(card?.edited || '')
    };
  };

  /**
   * Ein leerer Lernstand IST KEIN LERNSTAND (E135).
   *
   * `leererLernzustand` in `lebensbereiche.ts` gibt `sr: {}` zurück — ein
   * leeres Objekt, und ein leeres Objekt ist wahr. `stand?.sr || null` liess
   * es deshalb stehen, und danach galt in `warteschlange`:
   *
   *     neu     = alle.filter(card => !card.sr)          → nie eine Karte
   *     fällig  = alle.filter(card => card.sr && …)      → immer alle
   *
   * Gemessen mit vier fabrikneuen Karten: „0 neu, 5 fällig". Die Kachel
   * „neue Karten" konnte gar nichts anderes anzeigen als null, und der
   * Lernplan legte Karten, die noch niemand gesehen hat, unter „gelernt und
   * jetzt wieder dran".
   *
   * Geändert wird hier und nicht in `leererLernzustand`: dessen Form ist ein
   * Vertrag, an dem andere Leser hängen (`sm2(zustand.sr)` erwartet ein
   * Objekt). Was fehlt, ist die Unterscheidung — und die gehört an die
   * Stelle, die sie braucht.
   */
  const hatLernstand = (sr: unknown): boolean =>
    !!sr && typeof sr === 'object' && Object.keys(sr as object).length > 0;

  const karteMitStand = (card: any): any => {
    const stand = persoenlicherStand(card);
    return {
      ...card,
      sr: hatLernstand(stand?.sr) ? stand.sr : null,
      reviewVerlauf: stand?.reviewVerlauf || {},
    };
  };

  const lernkarten = (): any[] => lernkartenRoh().map(karteMitStand);

  const verlauf = (card: any): any[] => {
    if (typeof Learning !== 'undefined' && Learning.reviewLog) return Learning.reviewLog(card);
    return objektWerte(card?.reviewVerlauf)
      .sort((links: any, rechts: any) => String(links.at || '').localeCompare(String(rechts.at || '')));
  };

  const bewertung = (eintrag: any): number | null => {
    const note = Number(eintrag?.rating);
    return Number.isInteger(note) && note >= 1 && note <= 4 ? note : null;
  };

  const istFehler = (eintrag: any): boolean =>
    eintrag?.correct === false || (bewertung(eintrag) !== null && Number(eintrag.rating) < 3);

  const letzterEintrag = (card: any): any | null => {
    const eintraege = verlauf(card);
    return eintraege.length ? eintraege[eintraege.length - 1] : null;
  };

  const istLetzterFehler = (card: any): boolean => {
    const eintrag = letzterEintrag(card);
    return !!eintrag && istFehler(eintrag);
  };

  const themaVon = (card: any): string => {
    const direkt = card?.quiz?.topic ?? card?.lernThema ?? card?.topic ?? card?.thema;
    if (String(direkt || '').trim()) return String(direkt).trim();
    const quelle = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
    const seite = quelle?.pageId ? Store.getBlock(quelle.pageId) : seiteVon(card);
    return String(seite?.text || quelle?.label || 'Ohne Thema').trim() || 'Ohne Thema';
  };

  const fachVon = (card: any): string => {
    const direkt = card?.quiz?.subject ?? card?.lernFach ?? card?.fach ?? card?.subject;
    if (String(direkt || '').trim()) return String(direkt).trim();
    return themaVon(card);
  };

  const kartenTeile = (card: any): [string, string] => {
    if (typeof Learning !== 'undefined' && Learning.splitCard) return Learning.splitCard(card);
    const text = String(card?.text || '');
    const stelle = text.indexOf('::');
    return stelle >= 0
      ? [text.slice(0, stelle).trim(), text.slice(stelle + 2).trim()]
      : [text, '(noch keine Antwort)'];
  };

  const warteschlange = (neuLimit = 20): any => {
    const jetzt = Date.now();
    const alle = lernkarten();
    const neu = alle.filter(card => !card.sr).slice(0, Math.max(0, neuLimit));
    const faellig = alle.filter(card => card.sr &&
      (!card.sr.faellig || (datum(card.sr.faellig)?.getTime() || 0) <= jetzt));
    const fehler = faellig.filter(istLetzterFehler);
    const fehlerIds = new Set(fehler.map(card => card.id));
    const regulaer = faellig.filter(card => !fehlerIds.has(card.id));
    const spaeter = alle.filter(card => card.sr?.faellig &&
      (datum(card.sr.faellig)?.getTime() || 0) > jetzt)
      .sort((a, b) => (datum(a.sr.faellig)?.getTime() || 0) - (datum(b.sr.faellig)?.getTime() || 0));
    return {
      errors: fehler,
      due: regulaer,
      newCards: neu,
      all: [...fehler, ...regulaer, ...neu],
      future: spaeter,
      nextAt: String(spaeter[0]?.sr?.faellig || ''),
      exam: typeof Learning !== 'undefined' && Learning.nextExam ? Learning.nextExam() : null
    };
  };

  const statistik = (): any => {
    const karten = lernkarten();
    const queue = warteschlange();
    const logs = karten.flatMap(verlauf);
    const heute = tag(new Date());
    const heuteLogs = logs.filter(eintrag => tag(eintrag.at) === heute);
    const benotet = logs.filter(eintrag => bewertung(eintrag) !== null);
    const nochmal = benotet.filter(eintrag => bewertung(eintrag) === 1).length;
    const themen = typeof Learning !== 'undefined' && Learning.topicProgress
      ? Learning.topicProgress(karten)
      : [];
    return {
      total: karten.length,
      learned: karten.filter(card => !!card.sr).length,
      due: queue.errors.length + queue.due.length,
      newCards: karten.filter(card => !card.sr).length,
      mistakes: karten.filter(card => verlauf(card).some(istFehler)).length,
      reviewedToday: heuteLogs.length,
      reviews: logs.length,
      againReviews: nochmal,
      againRate: benotet.length ? Math.round(nochmal / benotet.length * 100) : 0,
      successRate: benotet.length
        ? Math.round(benotet.filter(eintrag => Number(eintrag.rating) >= 3).length / benotet.length * 100)
        : 0,
      nextAt: queue.nextAt,
      topics: themen,
      logs
    };
  };

  const schemaSchluessel = (collection: any, typ: string, namen: string[] = []): string => {
    const schema = collection?.schema || {};
    const keys = Object.keys(schema);
    return keys.find(key => schema[key]?.type === typ &&
      (!namen.length || namen.some(name => String(schema[key]?.name || key).toLowerCase().includes(name))))
      || keys.find(key => schema[key]?.type === typ)
      || '';
  };

  const zeilenWert = (row: any, collection: any, key: string): any => {
    if (!key) return '';
    if (typeof Datenbank !== 'undefined' && Datenbank.wert) {
      try { return Datenbank.wert(row, key, collection); } catch { /* Rohwert folgt */ }
    }
    return row?.props?.[key];
  };

  const pruefungen = (): LernweltPruefung[] => {
    const ausgabe: LernweltPruefung[] = [];
    Object.values<any>(Store.cache.collections).forEach(collection => {
      const name = String(collection?.name || '').toLowerCase();
      if (collection?.schoolKind !== 'exams' && !/prüfung|pruefung|exam|klausur/.test(name)) return;
      const datumKey = schemaSchluessel(collection, 'date');
      const fachKey = schemaSchluessel(collection, 'relation', ['fach', 'subject', 'modul']);
      const stoffKey = Object.keys(collection.schema || {}).find(key =>
        /lernstoff|umfang|quelle|scope|themen/.test(String(collection.schema[key]?.name || key).toLowerCase())) || '';
      const dauerKey = Object.keys(collection.schema || {}).find(key =>
        collection.schema[key]?.type === 'number' &&
        /dauer|min/.test(String(collection.schema[key]?.name || key).toLowerCase())) || '';
      const statusKey = schemaSchluessel(collection, 'status');
      Store.rowsOf(collection.id).forEach((row: any) => {
        if (!row || row.alive === false || !darfLesen(row) || !imBereich(row)) return;
        const d = datum(zeilenWert(row, collection, datumKey));
        const fachWert = zeilenWert(row, collection, fachKey);
        ausgabe.push({
          id: String(row.id),
          collectionId: String(collection.id),
          titel: String(row.text || row.props?.title || 'Prüfung'),
          datum: d,
          tage: d ? tageBis(d) : null,
          fach: textListe(fachWert).join(', ') || String(fachWert || ''),
          lernstoff: String(zeilenWert(row, collection, stoffKey) || ''),
          dauer: Math.max(5, Math.min(240, Math.round(zahl(zeilenWert(row, collection, dauerKey), 30)))),
          status: String(zeilenWert(row, collection, statusKey) || 'Geplant'),
          bereichIds: direkteBereichIds(row)
        });
      });
    });
    return ausgabe.sort((a, b) => {
      const aZeit = a.datum?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bZeit = b.datum?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aZeit - bZeit || a.titel.localeCompare(b.titel, 'de-CH');
    });
  };

  const aufgaben = (): LernweltAufgabe[] => {
    let roh: any[] = [];
    try {
      if (typeof Bibliothek !== 'undefined' && Bibliothek.meineAufgaben)
        roh = liste(Bibliothek.meineAufgaben());
      else if (typeof Plan !== 'undefined' && Plan.aufgaben) roh = liste(Plan.aufgaben());
    } catch { roh = []; }
    return roh.filter(item => imBereich(Store.getBlock(item.id) || item)).map(item => ({
      id: String(item.id || item.ref?.id || ''),
      titel: String(item.titel || item.text || 'Aufgabe'),
      datum: String(item.datum?.start || item.datum || ''),
      fertig: !!item.fertig,
      quelle: String(item.coll?.name || item.wo || item.quelle || 'Aufgaben'),
      bereichIds: textListe(item.bereichIds).length
        ? textListe(item.bereichIds)
        : direkteBereichIds(Store.getBlock(item.id) || item)
    })).filter(item => item.id);
  };

  const termine = (): LernweltTermin[] => {
    let roh: any[] = [];
    try {
      if (typeof App !== 'undefined' && App.kommendeTermine) roh = liste(App.kommendeTermine(20));
    } catch { roh = []; }
    return roh.map(item => ({
      id: String(item.id || item.ref?.id || ''),
      titel: String(item.text || item.titel || 'Termin'),
      datum: datum(item.d || item.datum || item.zeit) || new Date(),
      quelle: String(item.quelle || 'Kalender'),
      bereichIds: direkteBereichIds(Store.getBlock(item.id) || item)
    })).filter(item => item.id && imBereich(Store.getBlock(item.id) || item))
      .sort((a, b) => a.datum.getTime() - b.datum.getTime());
  };

  const zuletzt = (): LernweltEintrag[] => {
    let seiten: any[] = [];
    try {
      if (typeof App !== 'undefined' && App.kuerzlich) seiten = liste(App.kuerzlich());
      else if (typeof Bibliothek !== 'undefined' && Bibliothek.alleSeiten)
        seiten = liste(Bibliothek.alleSeiten()).sort((a, b) =>
          String(b.zuletztGeoeffnet || b.edited || '').localeCompare(String(a.zuletztGeoeffnet || a.edited || '')));
    } catch { seiten = []; }
    return seiten.filter(page => darfLesen(page) && imBereich(page)).slice(0, 8).map(page => ({
      id: String(page.id),
      titel: String(page.text || 'Ohne Titel'),
      icon: String(page.icon || '📄'),
      zeit: String(page.zuletztGeoeffnet || page.edited || page.created || ''),
      untertitel: 'Zuletzt geöffnet',
      bereichIds: direkteBereichIds(page)
    }));
  };

  const projekte = (): LernweltEintrag[] => {
    const seiten = alleBloecke().filter(block => {
      if (block.type !== 'page' || !imBereich(block)) return false;
      const marker = [block.systemRole, block.vorlage, block.art, block.kind, ...textListe(block.tags)]
        .join(' ').toLowerCase();
      return !!block.projekt || !!block.project || /projekt|project/.test(marker) ||
        /projekt/.test(String(block.text || '').toLowerCase());
    });
    return seiten.sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')))
      .slice(0, 8).map(page => ({
        id: String(page.id),
        titel: String(page.text || 'Projekt'),
        icon: String(page.icon || '🚀'),
        zeit: String(page.edited || page.created || ''),
        untertitel: String(page.status || 'Laufendes Projekt'),
        bereichIds: direkteBereichIds(page)
      }));
  };

  const pdfs = (): LernweltEintrag[] => {
    const gesehen = new Set<string>();
    const ausgabe: LernweltEintrag[] = [];
    alleBloecke().filter(block => block.type === 'pdfseite' && imBereich(block))
      .sort((a, b) => String(b.edited || b.created || '').localeCompare(String(a.edited || a.created || '')))
      .forEach(block => {
        const page = seiteVon(block);
        if (!page || gesehen.has(page.id) || !imBereich(page)) return;
        gesehen.add(page.id);
        ausgabe.push({
          id: String(page.id),
          titel: String(page.text || 'PDF'),
          icon: '📕',
          zeit: String(page.edited || block.edited || block.created || ''),
          untertitel: 'PDF · Seite ' + String(block.nr || 1),
          bereichIds: direkteBereichIds(page)
        });
      });
    return ausgabe.slice(0, 12);
  };

  const dokumente = (): LernweltEintrag[] => alleBloecke()
    .filter(block => block.type === 'page' && imBereich(block))
    .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')))
    .slice(0, 16).map(page => ({
      id: String(page.id),
      titel: String(page.text || 'Ohne Titel'),
      icon: String(page.icon || '📄'),
      zeit: String(page.edited || page.created || ''),
      untertitel: page.besprechung ? 'Meeting-Notiz' : 'Dokument',
      bereichIds: direkteBereichIds(page)
    }));

  const externeId = (item: any): string => String(item?.id || item?.ref?.id || item?.pageId || '');

  const externeEintraege = (
    items: any[],
    icon: string,
    untertitel: string,
    seiteBevorzugen = false
  ): LernweltEintrag[] =>
    items.map(item => ({
      id: String(seiteBevorzugen && item?.pageId ? item.pageId : externeId(item)),
      titel: String(item?.titel || item?.text || item?.name || untertitel),
      icon: String(item?.icon || icon),
      zeit: String(item?.zeit || item?.edited || item?.datum || ''),
      untertitel: String(item?.untertitel || item?.quelle || untertitel),
      bereichIds: textListe(item?.bereichIds)
    })).filter(item => item.id);

  const bereichOptionen = (): any => zustand.bereichId === 'alle'
    ? { limit: 24 }
    : { bereichIds: [zustand.bereichId], limit: 24 };

  const ladeBereichsdaten = (): void => {
    const api = lebensbereiche();
    if (!api) return;
    const schluessel = zustand.bereichId + ':' + zustand.ansicht;
    if (zustand.ladeSchluessel === schluessel) return;
    zustand.ladeSchluessel = schluessel;
    const generation = ++zustand.generation;
    const aufruf = (name: string): Promise<any> => {
      try {
        return typeof api[name] === 'function'
          ? Promise.resolve(api[name](bereichOptionen()))
          : Promise.resolve(name === 'heute' ? null : []);
      } catch { return Promise.resolve(name === 'heute' ? null : []); }
    };
    if (zustand.ansicht === 'heute' && typeof api.heute === 'function') {
      void aufruf('heute').then(heute => {
        if (generation !== zustand.generation || !zustand.root) return;
        const lernkartenHeute = heute?.lernkarten || {};
        zustand.extern = {
          heute,
          aufgaben: [...liste(heute?.aufgabenHeute), ...liste(heute?.aufgabenUeberfaellig)],
          termine: liste(heute?.termine),
          zuletzt: liste(heute?.zuletzt),
          projekte: liste(heute?.projekte),
          pdfs: liste(heute?.pdfs),
          lernkarten: [...liste(lernkartenHeute.fehler), ...liste(lernkartenHeute.faellig),
            ...liste(lernkartenHeute.neu)]
        };
        zeichnen();
      });
      return;
    }
    void Promise.all([
      aufruf('aufgaben'), aufruf('termine'), aufruf('zuletzt'),
      aufruf('projekte'), aufruf('pdfs')
    ]).then(([aufgabenWerte, termineWerte, zuletztWerte, projektWerte, pdfWerte]) => {
      if (generation !== zustand.generation || !zustand.root) return;
      zustand.extern = {
        heute: null,
        aufgaben: liste(aufgabenWerte),
        termine: liste(termineWerte),
        zuletzt: liste(zuletztWerte),
        projekte: liste(projektWerte),
        pdfs: liste(pdfWerte),
        lernkarten: []
      };
      zeichnen();
    });
  };

  const tagesziel = (): number => Math.max(1, Math.min(500,
    Math.round(zahl(Store.getMeta(metaSchluessel('tagesziel'), 20), 20))));

  const aktivitaet = (): any => {
    const stats = statistik();
    const logs = liste(stats.logs);
    const tage = new Map<string, number>();
    let minuten = 0;
    logs.forEach(eintrag => {
      const key = tag(eintrag.at);
      if (key) tage.set(key, (tage.get(key) || 0) + 1);
      const ms = zahl(eintrag.durationMs ?? eintrag.dauerMs, 0);
      const sek = zahl(eintrag.durationSeconds ?? eintrag.dauerSekunden, 0);
      minuten += ms > 0 ? ms / 60000 : sek > 0 ? sek / 60 : 1;
    });
    const heute = tagesStart();
    const wochentag = (heute.getDay() + 6) % 7;
    const wochenstart = new Date(heute);
    wochenstart.setDate(heute.getDate() - wochentag);
    const monatsstart = new Date(heute.getFullYear(), heute.getMonth(), 1);
    const woche = logs.filter(eintrag => (datum(eintrag.at)?.getTime() || 0) >= wochenstart.getTime()).length;
    const monat = logs.filter(eintrag => (datum(eintrag.at)?.getTime() || 0) >= monatsstart.getTime()).length;
    let streak = 0;
    let cursor = new Date(heute);
    if (!tage.has(tag(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (tage.has(tag(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    const xp = logs.length * 10;
    const level = Math.floor(xp / 500) + 1;
    return {
      heute: stats.reviewedToday,
      woche,
      monat,
      minuten: Math.round(minuten),
      streak,
      xp,
      level,
      wochenProzent: Math.min(100, Math.round(woche / (tagesziel() * 7) * 100))
    };
  };

  const eindeutige = <T,>(werte: T[], idVon: (wert: T) => string): T[] => {
    const gesehen = new Set<string>();
    return werte.filter(wert => {
      const id = idVon(wert);
      if (!id || gesehen.has(id)) return false;
      gesehen.add(id);
      return true;
    });
  };

  const sichtbareAufgaben = (): LernweltAufgabe[] => {
    const lokal = aufgaben();
    if (!zustand.extern) return lokal;
    const extern = zustand.extern.aufgaben.map((item: any): LernweltAufgabe => ({
      id: externeId(item),
      titel: String(item?.titel || item?.text || 'Aufgabe'),
      datum: String(item?.faellig?.start || item?.faellig || item?.datum?.start || item?.datum || item?.zeit || ''),
      fertig: !!(item?.fertig || item?.erledigt),
      quelle: String(item?.quelle || item?.collectionName || 'Aufgaben'),
      bereichIds: textListe(item?.bereichIds)
    })).filter(item => item.id);
    return eindeutige([...extern, ...lokal], item => item.id);
  };

  const sichtbareTermine = (): LernweltTermin[] => {
    const lokal = termine();
    if (!zustand.extern) return lokal;
    const extern = zustand.extern.termine.map((item: any): LernweltTermin => ({
      id: externeId(item),
      titel: String(item?.titel || item?.text || 'Termin'),
      datum: datum(item?.datum || item?.zeit || item?.start) || new Date(),
      quelle: String(item?.quelle || 'Kalender'),
      bereichIds: textListe(item?.bereichIds)
    })).filter(item => item.id);
    return eindeutige([...extern, ...lokal], item => item.id)
      .sort((a, b) => a.datum.getTime() - b.datum.getTime());
  };

  const sichtbareZuletzt = (): LernweltEintrag[] => zustand.extern?.zuletzt.length
    ? externeEintraege(zustand.extern.zuletzt, '📄', 'Zuletzt geöffnet').slice(0, 8)
    : zuletzt();

  const sichtbareProjekte = (): LernweltEintrag[] => zustand.extern?.projekte.length
    ? externeEintraege(zustand.extern.projekte, '🚀', 'Laufendes Projekt').slice(0, 8)
    : projekte();

  const sichtbarePdfs = (): LernweltEintrag[] => zustand.extern?.pdfs.length
    ? externeEintraege(zustand.extern.pdfs, '📕', 'PDF', true).slice(0, 12)
    : pdfs();

  const fortschreibung = (card: any, note: number): { sr: any; reviewVerlauf: Record<string, any> } => {
    const stand = persoenlicherStand(card);
    const sr = { ease: 2.5, intervall: 0, wdh: 0, ...(stand?.sr || card?.sr || {}) };
    const vorher = {
      due: String(sr.faellig || ''),
      interval: zahl(sr.intervall),
      ease: zahl(sr.ease, 2.5),
      repetitions: zahl(sr.wdh)
    };
    if (note < 3) {
      sr.wdh = 0;
      sr.intervall = note === 1 ? 0 : 1;
    } else {
      sr.wdh = zahl(sr.wdh) + 1;
      sr.intervall = sr.wdh === 1 ? 1 : sr.wdh === 2 ? 6
        : Math.round(zahl(sr.intervall) * zahl(sr.ease, 2.5));
      sr.ease = Math.max(1.3,
        zahl(sr.ease, 2.5) + (0.1 - (4 - note) * (0.08 + (4 - note) * 0.02)));
    }
    const faellig = new Date();
    if (sr.intervall === 0) faellig.setMinutes(faellig.getMinutes() + 10);
    else faellig.setDate(faellig.getDate() + sr.intervall);
    sr.faellig = faellig.toISOString();
    sr.zuletzt = Store.now();
    const alt = Object.fromEntries(verlauf({ reviewVerlauf: stand?.reviewVerlauf || card?.reviewVerlauf || {} })
      .map((eintrag: any, index: number) => [String(eintrag.id || 'legacy-' + index), eintrag]));
    const id = typeof Store.uid === 'function'
      ? Store.uid()
      : 'review-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    alt[id] = {
      id,
      version: 1,
      at: sr.zuletzt,
      rating: note,
      algorithm: 'sm2',
      lapse: note < 3,
      before: vorher,
      after: {
        due: sr.faellig,
        interval: sr.intervall,
        ease: sr.ease,
        repetitions: sr.wdh
      }
    };
    const behalten = Object.values<any>(alt)
      .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) ||
        String(a.id || '').localeCompare(String(b.id || '')))
      .slice(-500);
    return { sr, reviewVerlauf: Object.fromEntries(behalten.map(eintrag => [String(eintrag.id), eintrag])) };
  };

  const karteBewerten = async (card: any, note: number): Promise<void> => {
    const original = Store.getBlock(card?.id);
    if (!original) throw new Error('Die Lernkarte ist nicht mehr vorhanden.');
    const api = lebensbereiche();
    if (hatExternenLernvertrag(api)) {
      if (!darfLesen(original)) throw new Error('Du darfst diese Lernkarte nicht lesen.');
      const neu = fortschreibung(original, note);
      await api.lernzustand.schreiben(
        { art: 'block', id: String(original.id) },
        aktor().id,
        { sr: neu.sr, reviewVerlauf: neu.reviewVerlauf, algorithm: 'sm2' }
      );
      return;
    }
    /* Ohne den getrennten Store-Vertrag bleibt das bisherige Verhalten: Der
       Legacy-Dienst schreibt in die Karte und braucht deshalb Bearbeitungsrecht. */
    if (typeof Learning !== 'undefined' && Learning.canEditCard && !Learning.canEditCard(original))
      throw new Error('Diese Lernkarte ist nur lesbar.');
    WissenDienst.planen(original, note);
  };

  const fehlerListe = (): LernweltFehler[] => lernkarten().map(card => {
    const falsche = verlauf(card).filter(istFehler);
    if (!falsche.length) return null;
    const letzter = falsche[falsche.length - 1];
    const [frage, antwort] = kartenTeile(card);
    const source = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
    const quelle = typeof Learning !== 'undefined' && Learning.sourceLabel
      ? Learning.sourceLabel(source)
      : String(source?.label || seiteVon(card)?.text || 'Ohne Quelle');
    const letztesGesamt = letzterEintrag(card);
    return {
      card,
      frage,
      antwort,
      letzteAntwort: String(letzter?.answer || letzter?.antwort || letzter?.input ||
        letzter?.eingabe || (bewertung(letzter) ? 'Bewertung ' + bewertung(letzter) : 'nicht gespeichert')),
      fach: fachVon(card),
      thema: themaVon(card),
      quelle,
      anzahl: falsche.length,
      zuletzt: String(letzter?.at || ''),
      naechste: String(card?.sr?.faellig || ''),
      stabil: !!letztesGesamt && !istFehler(letztesGesamt) && zahl(card?.sr?.wdh) >= 2
    } as LernweltFehler;
  }).filter((item): item is LernweltFehler => !!item)
    .sort((a, b) => Number(a.stabil) - Number(b.stabil) ||
      String(b.zuletzt).localeCompare(String(a.zuletzt)));

  /**
   * Nur die Karten, die WIRKLICH zur Prüfung passen — ohne den Rückfall auf
   * alle (E136).
   *
   * `passendeKarten` gibt bei null Treffern den ganzen Bestand zurück. Für
   * die Simulation ist das vertretbar: lieber eine Übungsklausur aus allem
   * als gar keine. Für die Kachel „Prüfungsfokus" wäre es eine Unwahrheit —
   * sie verspricht „passend zur nächsten Prüfung", und wer dann alles
   * bekommt, merkt es nicht.
   */
  const nurPassendeKarten = (pruefung: LernweltPruefung): any[] => {
    const woerter = (pruefung.titel + ' ' + pruefung.fach + ' ' + pruefung.lernstoff)
      .toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(wort => wort.length >= 3);
    if (!woerter.length) return [];
    return lernkarten().filter(card => {
      const suchtext = (themaVon(card) + ' ' + fachVon(card) + ' ' +
                        String(card.text || '')).toLowerCase();
      return woerter.some(wort => suchtext.includes(wort));
    });
  };

  const passendeKarten = (pruefung: LernweltPruefung): any[] => {
    const woerter = (pruefung.titel + ' ' + pruefung.fach + ' ' + pruefung.lernstoff)
      .toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(wort => wort.length >= 3);
    if (!woerter.length) return lernkarten();
    const passend = lernkarten().filter(card => {
      const suchtext = (themaVon(card) + ' ' + fachVon(card) + ' ' + String(card.text || '')).toLowerCase();
      return woerter.some(wort => suchtext.includes(wort));
    });
    return passend.length ? passend : lernkarten();
  };

  const aktiverBereich = (): LernweltBereich => bereiche().find(item => item.id === zustand.bereichId)
    || bereiche()[0]
    || { id: 'alle', name: 'Alle Bereiche', icon: '◎', art: 'alle' };

  const prozent = (wert: unknown): number => Math.max(0, Math.min(100, Math.round(zahl(wert))));

  const kennzahl = (wert: string, name: string, zusatz = ''): string =>
    '<article class="lw-metrik"><strong>' + esc(wert) + '</strong><span>' + esc(name) + '</span>' +
      (zusatz ? '<small>' + esc(zusatz) + '</small>' : '') + '</article>';

  const fortschritt = (wert: number, label: string): string =>
    '<div class="lw-progress"><div><span>' + esc(label) + '</span><strong>' + prozent(wert) +
      ' %</strong></div><progress max="100" value="' + prozent(wert) + '" aria-label="' +
      esc(label) + '">' + prozent(wert) + ' %</progress></div>';

  const leer = (icon: string, titel: string, text: string, aktion = '', label = ''): string =>
    '<div class="lw-leer"><span class="lw-leer-icon" aria-hidden="true">' + esc(icon) + '</span>' +
      '<h3>' + esc(titel) + '</h3><p>' + esc(text) + '</p>' +
      (aktion && label ? '<button type="button" data-lw-action="' + esc(aktion) + '">' + esc(label) + '</button>' : '') +
      '</div>';

  const sektion = (titel: string, inhalt: string, zusatz = ''): string =>
    '<section class="lw-section"><header><div><h2>' + esc(titel) + '</h2>' +
      (zusatz ? '<p>' + esc(zusatz) + '</p>' : '') + '</div></header>' + inhalt + '</section>';

  const eintragListe = (werte: LernweltEintrag[], leerText: string): string => werte.length
    ? '<ul class="lw-object-list">' + werte.map(item =>
        '<li><button type="button" data-lw-open="' + esc(item.id) + '"><span class="lw-object-icon" aria-hidden="true">' +
          esc(item.icon) + '</span><span><strong>' + esc(item.titel) + '</strong><small>' +
          esc(item.untertitel) + (item.zeit ? ' · ' + esc(relativText(item.zeit)) : '') +
          '</small></span><span aria-hidden="true">›</span></button></li>').join('') + '</ul>'
    : '<p class="lw-none">' + esc(leerText) + '</p>';

  const aufgabenListe = (werte: LernweltAufgabe[], leerText: string): string => werte.length
    ? '<ul class="lw-task-list">' + werte.map(item =>
        '<li><button type="button" data-lw-open="' + esc(item.id) + '"><span aria-hidden="true">' +
          (item.fertig ? '☑' : '☐') + '</span><span><strong>' + esc(item.titel) + '</strong><small>' +
          esc(item.quelle) + (item.datum ? ' · ' + esc(datumText(item.datum)) : '') +
          '</small></span></button></li>').join('') + '</ul>'
    : '<p class="lw-none">' + esc(leerText) + '</p>';

  const terminListe = (werte: LernweltTermin[], leerText: string): string => werte.length
    ? '<ul class="lw-event-list">' + werte.map(item =>
        '<li><button type="button" data-lw-open="' + esc(item.id) + '"><time datetime="' +
          esc(item.datum.toISOString()) + '">' + esc(item.datum.toLocaleTimeString('de-CH', {
            hour: '2-digit', minute: '2-digit'
          })) + '</time><span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.quelle) +
          ' · ' + esc(datumText(item.datum)) + '</small></span></button></li>').join('') + '</ul>'
    : '<p class="lw-none">' + esc(leerText) + '</p>';

  const themenListe = (themen: any[], limit = 8): string => themen.length
    ? '<div class="lw-topic-list">' + themen.slice(0, limit).map(thema =>
        '<button type="button" data-lw-topic="' + esc(thema.id) + '"><span><strong>' +
          esc(thema.label) + '</strong><small>' + esc(thema.stable + ' stabil · ' + thema.due +
          ' fällig' + (thema.errors ? ' · ' + thema.errors + ' Fehler' : '')) + '</small></span>' +
          '<span class="lw-topic-score">' + prozent(thema.progress) + ' %</span><progress max="100" value="' +
          prozent(thema.progress) + '" aria-label="Fortschritt ' + esc(thema.label) + '"></progress></button>')
        .join('') + '</div>'
    : leer('🎴', 'Noch keine Themen', 'Themen entstehen automatisch aus deinen Lernkarten.',
        'capture', 'Lernmaterial erfassen');

  const kopf = (): string => {
    const optionen = bereiche();
    const aktiv = aktiverBereich();
    return '<header class="lw-head">' +
      '<div class="lw-brand"><span class="lw-brand-icon" aria-hidden="true">🎓</span><div>' +
        '<p>Redion</p><h1>Lernen &amp; Alltag</h1></div></div>' +
      '<label class="lw-area"><span>Bereich</span><select data-lw-area aria-label="Lebensbereich auswählen">' +
        optionen.map(item => '<option value="' + esc(item.id) + '"' +
          (item.id === aktiv.id ? ' selected' : '') + '>' + esc(item.icon + ' ' + item.name) + '</option>').join('') +
        '</select></label></header>' +
      '<nav class="lw-nav" aria-label="Lernen und Alltag">' + ANSICHTEN.map(item =>
        '<button type="button" data-lw-nav="' + item.id + '"' +
          (zustand.ansicht === item.id ? ' aria-current="page" class="is-active"' : '') + '>' +
          '<span aria-hidden="true">' + item.icon + '</span><span>' + esc(item.name) + '</span></button>').join('') +
        '</nav>';
  };

  const heuteAnsicht = (): string => {
    const queue = warteschlange();
    const stats = statistik();
    const spiel = aktivitaet();
    const ziel = tagesziel();
    const zielProzent = ziel ? Math.min(100, Math.round(stats.reviewedToday / ziel * 100)) : 0;
    const stunde = new Date().getHours();
    const gruss = stunde < 11 ? 'Guten Morgen' : stunde < 17 ? 'Guten Tag' : 'Guten Abend';
    const heute = tagesStart();
    const morgen = new Date(heute); morgen.setDate(morgen.getDate() + 1);
    const alleAufgaben = sichtbareAufgaben().filter(item => !item.fertig);
    const heutigeAufgaben = alleAufgaben.filter(item => datum(item.datum) &&
      (datum(item.datum)?.getTime() || 0) >= heute.getTime() &&
      (datum(item.datum)?.getTime() || 0) < morgen.getTime());
    const ueberfaellige = alleAufgaben.filter(item => datum(item.datum) &&
      (datum(item.datum)?.getTime() || 0) < heute.getTime());
    const heutigeTermine = sichtbareTermine().filter(item =>
      item.datum.getTime() >= heute.getTime() && item.datum.getTime() < morgen.getTime()).slice(0, 6);
    const naechstePruefung = pruefungen().find(item => item.tage === null || item.tage >= 0) || null;
    const pruefungText = naechstePruefung
      ? naechstePruefung.tage === 0 ? 'heute'
        : naechstePruefung.tage === 1 ? 'morgen'
        : naechstePruefung.tage + ' Tage'
      : 'keine geplant';
    /* DIE EINRICHTUNG ALS ANGEBOT, NICHT ALS SPERRE (E137).
       Sie öffnete sich früher von selbst über alles. Jetzt steht sie hier,
       solange sie noch nicht durchlaufen ist — sichtbar für jeden, der neu
       ist, und im Weg für niemanden. Wer sie überspringt oder abschliesst,
       sieht die Karte nicht mehr. */
    const einrichtung = (() => {
      const modul = (globalThis as any).ProduktOnboarding;
      let neuHier = false;
      try { neuHier = modul?.profil?.().status === 'neu'; } catch { neuHier = false; }
      if (!neuHier) return '';
      return '<section class="lw-note lw-setup"><div><strong>Redion einrichten</strong>' +
        '<p>Zwei Hauptwelten, ein Bestand: lege fest, womit du anfangen willst. ' +
        'Deine Inhalte bleiben, wo sie sind.</p></div>' +
        '<button type="button" data-lw-action="setup">Einrichten</button></section>';
    })();

    return '<div class="lw-today">' +
      einrichtung +
      '<section class="lw-hero"><div><p>' + esc(gruss + ', ' + aktor().name) + '</p><h2>' +
        esc(new Date().toLocaleDateString('de-CH', {
          weekday: 'long', day: 'numeric', month: 'long'
        })) + '</h2><span>' + esc(aktiverBereich().icon + ' ' + aktiverBereich().name) +
        '</span></div><div class="lw-goal"><button type="button" data-lw-action="goal" aria-label="Tagesziel ändern">' +
        '<span>' + stats.reviewedToday + ' / ' + ziel + '</span><small>Lernziel heute</small></button>' +
        '<progress max="100" value="' + zielProzent + '" aria-label="Tagesfortschritt"></progress></div></section>' +
      '<section class="lw-metrics" aria-label="Heute auf einen Blick">' +
        kennzahl(String(queue.errors.length + queue.due.length), 'fällig', 'SM-2-Wissensstand') +
        kennzahl(String(queue.newCards.length), 'neu', 'maximal 20 in der Runde') +
        kennzahl(String(fehlerListe().filter(item => !item.stabil).length), 'Fehler', 'gezielt wiederholen') +
        kennzahl(pruefungText, 'nächste Prüfung', naechstePruefung?.titel || '') + '</section>' +
      '<div class="lw-primary-grid">' +
        '<section class="lw-focus-card"><header><div><p>Deine Tagesrunde</p><h2>' +
          (queue.all.length ? queue.all.length + ' Karten warten' : 'Alles für heute erledigt') +
          '</h2></div><span aria-hidden="true">🎴</span></header><p>' +
          (queue.all.length
            ? 'Zuerst Fehler, danach fällige Karten und zum Schluss neue Inhalte.'
            : stats.total ? 'Die nächste Wiederholung erscheint automatisch zum geplanten Zeitpunkt.'
              : 'Erstelle deine erste Karte aus einer Notiz, einem Text oder PDF.') + '</p><div class="lw-actions">' +
          '<button type="button" class="is-primary" data-lw-train="today"' +
            (queue.all.length ? '' : ' disabled') + '>Tagesrunde starten</button>' +
          '<button type="button" data-lw-nav="lernen">Plan ansehen</button></div></section>' +
        '<section class="lw-exam-card"><header><p>Nächste Prüfung</p><span aria-hidden="true">📝</span></header>' +
          (naechstePruefung
            ? '<h2>' + esc(naechstePruefung.titel) + '</h2><strong>' + esc(pruefungText) + '</strong><p>' +
                esc(naechstePruefung.fach || naechstePruefung.lernstoff || 'Lernstoff noch nicht zugeordnet') +
                '</p><button type="button" data-lw-exam="' + esc(naechstePruefung.id) + '">Vorbereitung öffnen</button>'
            : leer('🗓️', 'Keine Prüfung geplant', 'Lege einen Termin in deiner Prüfungsdatenbank an.',
                'school-setup', 'Prüfungen öffnen')) + '</section>' +
      '</div>' +
      '<div class="lw-dashboard-grid">' +
        sektion('Aufgaben heute', aufgabenListe(heutigeAufgaben.slice(0, 6), 'Heute ist keine Aufgabe fällig.'),
          heutigeAufgaben.length + ' heute') +
        sektion('Überfällig', aufgabenListe(ueberfaellige.slice(0, 6), 'Keine überfällige Aufgabe.'),
          ueberfaellige.length ? ueberfaellige.length + ' brauchen Aufmerksamkeit' : 'alles im Plan') +
        sektion('Termine', terminListe(heutigeTermine, 'Heute steht kein Termin an.'), 'Unterricht, Arbeit und Meetings') +
        sektion('Zuletzt geöffnet', eintragListe(sichtbareZuletzt(), 'Noch keine zuletzt geöffnete Seite.'),
          'dieselben Dateien wie im Workspace') +
        sektion('Laufende Projekte', eintragListe(sichtbareProjekte(), 'Noch kein Projekt zugeordnet.'),
          'ohne Kopien') +
        sektion('Themenfortschritt', themenListe(liste(stats.topics), 5), 'fachlicher SM-2-Stand') +
      '</div>' +
      '<section class="lw-engagement"><header><div><p>Aktivität &amp; Motivation</p><h2>Deine Lernroutine</h2></div>' +
        '<span>Getrennt vom Wissensstand</span></header><div class="lw-metrics">' +
        kennzahl('~' + spiel.minuten + ' Min.', 'Lernzeit', 'aus Lernaktivitäten geschätzt') +
        kennzahl(spiel.woche + ' / ' + ziel * 7, 'Wochenziel') +
        kennzahl(spiel.streak + ' Tage', 'Streak') +
        kennzahl(String(spiel.xp), 'Aktivitäts-XP', 'kein Wissensstand') +
        kennzahl(String(spiel.level), 'Level', 'Motivation, nicht Fachfortschritt') +
      '</div>' + fortschritt(spiel.wochenProzent, 'Wochenfortschritt') + '</section>' +
      '<div class="lw-quick" aria-label="Schnellzugriff">' +
        '<button type="button" data-lw-action="tasks"><span aria-hidden="true">✅</span>Alle Aufgaben</button>' +
        '<button type="button" data-lw-action="calendar"><span aria-hidden="true">📅</span>Kalender</button>' +
        '<button type="button" data-lw-action="library"><span aria-hidden="true">📚</span>Bibliothek</button>' +
        '<button type="button" data-lw-action="capture"><span aria-hidden="true">📷</span>Erfassen</button>' +
      '</div></div>';
  };

  const verlaufsTage = (logs: any[], anzahl: number): Array<{ tag: Date; anzahl: number }> => {
    const heute = tagesStart();
    return Array.from({ length: anzahl }, (_, index) => {
      const d = new Date(heute);
      d.setDate(heute.getDate() - (anzahl - index - 1));
      const key = tag(d);
      return { tag: d, anzahl: logs.filter(eintrag => tag(eintrag.at) === key).length };
    });
  };

  const historie = (logs: any[], tage = 7): string => {
    const werte = verlaufsTage(logs, tage);
    const maximum = Math.max(1, ...werte.map(item => item.anzahl));
    return '<div class="lw-history" aria-label="Lernhistorie der letzten ' + tage + ' Tage">' +
      werte.map(item => '<div><span>' + item.anzahl + '</span><progress max="' + maximum + '" value="' +
        item.anzahl + '" aria-label="' + esc(item.tag.toLocaleDateString('de-CH')) + ': ' + item.anzahl +
        '"></progress><small>' + esc(item.tag.toLocaleDateString('de-CH', { weekday: 'short' })) +
        '</small></div>').join('') + '</div>';
  };

  const kartenArt = (card: any): string => {
    const text = String(card?.text || '');
    if (/\{\{[^{}]+\}\}/.test(text)) return 'Lückentext';
    const source = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
    if (source?.kind === 'pdfseite' && source?.region) return 'PDF-Auswahl';
    if (source?.kind === 'pdfseite') return 'PDF-Karte';
    if (card?.quiz?.kind === 'calculation' || card?.rechenkarte) return 'Rechenkarte';
    return 'Frage / Antwort';
  };

  const lernzentrumAnsicht = (): string => {
    if (zustand.training) return trainingAnsicht();
    const queue = warteschlange();
    const stats = statistik();
    const artZaehler = new Map<string, number>();
    lernkarten().forEach(card => artZaehler.set(kartenArt(card), (artZaehler.get(kartenArt(card)) || 0) + 1));
    const fokus = liste(stats.topics).find(item => item.id === zustand.themaId);
    return '<div class="lw-learning">' +
      '<header class="lw-page-head"><div><p>Lernzentrale</p><h2>' +
        (fokus ? esc(fokus.label) : 'Dein erklärbarer Lernplan') + '</h2><span>SM-2 bleibt der fachliche Plan. Es gibt keine stille Migration.</span></div>' +
        '<button type="button" data-lw-action="learning-classic">Klassische Lernansicht</button></header>' +
      '<section class="lw-metrics">' +
        kennzahl(String(queue.errors.length), 'fällige Fehler') +
        kennzahl(String(queue.due.length), 'fällige Karten') +
        kennzahl(String(queue.newCards.length), 'neue Karten') +
        kennzahl(stats.nextAt ? datumText(stats.nextAt, true) : '—', 'nächste Wiederholung') +
      '</section>' +
      '<div class="lw-study-actions">' +
        '<article><span aria-hidden="true">☀️</span><h3>Tagesrunde</h3><p>Fehler → fällig → bis zu 20 neue Karten.</p>' +
          '<button type="button" class="is-primary" data-lw-train="today"' +
          (queue.all.length ? '' : ' disabled') + '>Starten · ' + queue.all.length + '</button></article>' +
        '<article><span aria-hidden="true">🧩</span><h3>Fehlertraining</h3><p>Alle instabilen Fehler gezielt festigen.</p>' +
          '<button type="button" data-lw-train="errors"' +
          (fehlerListe().some(item => !item.stabil) ? '' : ' disabled') + '>Trainieren · ' +
          fehlerListe().filter(item => !item.stabil).length + '</button></article>' +
        '<article><span aria-hidden="true">✨</span><h3>Neue Karten</h3><p>Neue Inhalte ohne fällige Karten üben.</p>' +
          '<button type="button" data-lw-train="new"' +
          (queue.newCards.length ? '' : ' disabled') + '>Lernen · ' + queue.newCards.length + '</button></article>' +
        /* DIE KACHEL TUT JETZT, WAS AUF IHR STEHT (E136). Sie versprach
           „Karten passend zur nächsten Prüfung mischen" und trug einen Knopf,
           der nur den Reiter wechselte. Gibt es keine passenden Karten, sagt
           sie das — statt einen Knopf anzubieten, hinter dem der ganze
           Bestand käme. */
        (() => {
          const naechste = pruefungen().find(item => item.tage !== null && item.tage >= 0)
            || pruefungen().find(item => item.tage === null) || null;
          const passend = naechste ? nurPassendeKarten(naechste) : [];
          return '<article><span aria-hidden="true">📝</span><h3>Prüfungsfokus</h3><p>' +
            (naechste
              ? esc('Karten passend zu „' + naechste.titel + '" mischen.')
              : 'Sobald eine Prüfung eingetragen ist, wird hier gezielt geübt.') +
            '</p>' +
            (passend.length
              ? '<button type="button" data-lw-train="exam">Üben · ' + passend.length + '</button>'
              : '<button type="button" data-lw-nav="pruefungen">Prüfungen öffnen</button>') +
            '</article>';
        })() +
      '</div>' +
      '<div class="lw-dashboard-grid">' +
        sektion('Warum diese Reihenfolge?', '<ol class="lw-explanation"><li><strong>Fehler zuerst</strong><span>Unsichere Inhalte bekommen unmittelbar Aufmerksamkeit.</span></li>' +
          '<li><strong>Fälligkeit danach</strong><span>Der gespeicherte SM-2-Termin bestimmt den Zeitpunkt.</span></li>' +
          '<li><strong>Neues zum Schluss</strong><span>So verdrängen neue Karten keine Wiederholung.</span></li></ol>',
          'Planung bleibt nachvollziehbar') +
        sektion('Letzte 7 Tage', historie(liste(stats.logs), 7), stats.reviewedToday + ' Wiederholungen heute') +
        sektion('Kartenarten', '<dl class="lw-card-types">' + [...artZaehler.entries()].map(([art, anzahl]) =>
          '<div><dt>' + esc(art) + '</dt><dd>' + anzahl + '</dd></div>').join('') + '</dl>',
          stats.total + ' Karten mit Quellen') +
        sektion('Themen & Fächer', themenListe(liste(stats.topics), 12),
          'Fortschritt aus Wiederholungen, nicht aus XP') +
      '</div></div>';
  };

  const lernpfadAnsicht = (): string => {
    const themen = liste(statistik().topics);
    const reihenfolge = ['grundlagen', 'spannung', 'strom', 'widerstand', 'ohm', 'reihe',
      'parallel', 'leistung', 'energie', 'lampe', 'prüfung'];
    const rang = (thema: any): number => {
      const text = String(thema.label || '').toLowerCase();
      const index = reihenfolge.findIndex(wort => text.includes(wort));
      return index < 0 ? reihenfolge.length : index;
    };
    const sortiert = [...themen].sort((a, b) => rang(a) - rang(b) ||
      String(a.label).localeCompare(String(b.label), 'de-CH'));
    return '<div class="lw-path-page"><header class="lw-page-head"><div><p>Lernpfad</p>' +
      '<h2>Jedes Thema ist erreichbar</h2><span>Der Pfad ordnet den Stoff. Er sperrt nichts künstlich.</span></div>' +
      '<button type="button" data-lw-nav="fortschritt">Fortschritt erklären</button></header>' +
      (sortiert.length
        ? '<ol class="lw-path" aria-label="Lernpfad">' + sortiert.map((thema, index) => {
            const status = thema.progress >= 100 ? 'is-stable' : thema.progress > 0 ? 'is-active' : 'is-new';
            const label = thema.progress >= 100 ? 'stabil' : thema.progress > 0 ? 'im Aufbau' : 'bereit';
            return '<li class="' + status + '"><span class="lw-path-line" aria-hidden="true"></span>' +
              '<button type="button" data-lw-path-topic="' + esc(thema.id) + '"><span class="lw-path-step">' +
                (index + 1) + '</span><span class="lw-path-copy"><small>' + esc(label) + '</small><strong>' +
                esc(thema.label) + '</strong><span>' + esc(thema.stable + ' von ' + thema.total + ' stabil' +
                (thema.errors ? ' · ' + thema.errors + ' Fehler' : '')) + '</span><progress max="100" value="' +
                prozent(thema.progress) + '" aria-label="' + esc(thema.label) + ': ' + prozent(thema.progress) +
                ' Prozent"></progress></span><span class="lw-path-open">Lernen</span></button></li>';
          }).join('') + '</ol>'
        : leer('🧭', 'Dein Lernpfad ist noch leer',
            'Sobald Lernkarten Themen tragen, erscheinen sie hier als frei erreichbare Stufen.',
            'capture', 'Erste Karte erstellen')) +
      '<aside class="lw-note"><strong>Fortschritt und Motivation bleiben getrennt.</strong>' +
        '<p>Die Prozentzahl kommt aus deinem persönlichen SM-2-Lernstand. XP und Level zeigen nur Aktivität.</p></aside>' +
      '</div>';
  };

  const fehlerAnsicht = (): string => {
    if (zustand.training) return trainingAnsicht();
    const fehler = fehlerListe();
    const offen = fehler.filter(item => !item.stabil);
    return '<div class="lw-errors"><header class="lw-page-head"><div><p>Fehlerzentrum</p><h2>Meine Fehler</h2>' +
      '<span>Jeder Eintrag bleibt mit seiner ursprünglichen Quelle verbunden.</span></div>' +
      '<button type="button" class="is-primary" data-lw-train="errors"' + (offen.length ? '' : ' disabled') +
      '>Fehler trainieren · ' + offen.length + '</button></header>' +
      '<section class="lw-metrics">' +
        kennzahl(String(offen.length), 'noch instabil') +
        kennzahl(String(fehler.filter(item => item.stabil).length), 'inzwischen stabil') +
        kennzahl(String(fehler.reduce((summe, item) => summe + item.anzahl, 0)), 'Fehlversuche') +
      '</section>' +
      (fehler.length
        ? '<div class="lw-error-list">' + fehler.map(item =>
            '<article class="' + (item.stabil ? 'is-stable' : 'is-open') + '"><header><div><span>' +
              esc(item.fach) + '</span><h3>' + esc(item.frage) + '</h3></div><strong>' +
              (item.stabil ? '✓ stabil' : item.anzahl + (item.anzahl === 1 ? ' Fehler' : ' Fehler')) +
              '</strong></header><dl><div><dt>Letzte falsche Antwort</dt><dd>' + esc(item.letzteAntwort) +
              '</dd></div><div><dt>Richtige Antwort</dt><dd>' + esc(item.antwort) +
              '</dd></div><div><dt>Thema</dt><dd>' + esc(item.thema) +
              '</dd></div><div><dt>Quelle</dt><dd>' + esc(item.quelle) +
              '</dd></div><div><dt>Letzter Fehler</dt><dd>' + esc(datumText(item.zuletzt, true)) +
              '</dd></div><div><dt>Nächste Wiederholung</dt><dd>' + esc(datumText(item.naechste, true)) +
              '</dd></div></dl><footer><button type="button" data-lw-card-source="' + esc(item.card.id) +
              '">Quelle öffnen</button><button type="button" data-lw-train-card="' + esc(item.card.id) +
              '">Diese Karte üben</button></footer></article>').join('') + '</div>'
        : leer('🎉', 'Noch keine Fehler', 'Bewertete Fehler erscheinen hier mit Antwort, Thema und Quelle.',
            'nav-lernen', 'Lernen starten')) + '</div>';
  };

  const pruefungsFortschritt = (pruefung: LernweltPruefung): number => {
    const karten = passendeKarten(pruefung);
    if (!karten.length) return 0;
    return Math.round(karten.reduce((summe, card) =>
      summe + Math.min(2, Math.max(0, zahl(card?.sr?.wdh))), 0) / (karten.length * 2) * 100);
  };

  const pruefungenAnsicht = (): string => {
    if (zustand.simulation) return simulationAnsicht();
    const alle = pruefungen();
    const kommende = alle.filter(item => item.tage === null || item.tage >= 0);
    const vergangene = alle.filter(item => item.tage !== null && item.tage < 0);
    return '<div class="lw-exams"><header class="lw-page-head"><div><p>Prüfungszentrale</p><h2>Kommende Prüfungen</h2>' +
      '<span>Lernstoff, Quellen, Aufgaben, Fehler und Karten aus denselben Redion-Daten.</span></div>' +
      '<button type="button" data-lw-simulate="weekly"' + (lernkarten().length ? '' : ' disabled') +
      '>Wochenprüfung simulieren</button></header>' +
      (kommende.length
        ? '<div class="lw-exam-list">' + kommende.map(item => {
            const karten = passendeKarten(item);
            const fehler = karten.filter(card => verlauf(card).some(istFehler)).length;
            const passendeAufgaben = sichtbareAufgaben().filter(aufgabe =>
              (aufgabe.titel + ' ' + aufgabe.quelle).toLowerCase().includes(item.titel.toLowerCase())).length;
            return '<article><header><div><span>' + esc(item.fach || 'Prüfung') + '</span><h3>' +
              esc(item.titel) + '</h3><time datetime="' + esc(item.datum?.toISOString() || '') + '">' +
              esc(item.datum ? datumText(item.datum) : 'Termin offen') + '</time></div><strong>' +
              (item.tage === null ? 'Termin offen' : item.tage === 0 ? 'heute' : item.tage === 1 ? 'morgen' :
                item.tage + ' Tage') + '</strong></header><p>' +
              esc(item.lernstoff || 'Noch kein Lernstoff hinterlegt.') + '</p>' +
              fortschritt(pruefungsFortschritt(item), 'Fachlicher Lernstand') +
              '<dl><div><dt>Karten</dt><dd>' + karten.length + '</dd></div><div><dt>Fehler</dt><dd>' +
              fehler + '</dd></div><div><dt>Aufgaben</dt><dd>' + passendeAufgaben +
              '</dd></div><div><dt>Zeitlimit</dt><dd>' + item.dauer + ' Min.</dd></div></dl><footer>' +
              '<button type="button" data-lw-open="' + esc(item.id) + '">Prüfung öffnen</button>' +
              '<button type="button" class="is-primary" data-lw-simulate="' + esc(item.id) + '"' +
              (karten.length ? '' : ' disabled') + '>Simulation starten</button></footer></article>';
          }).join('') + '</div>'
        : leer('🗓️', 'Keine Prüfung geplant',
            'Prüfungen bleiben normale Datenbankzeilen. Lege einen Termin in der Ausbildung an.',
            'school-setup', 'Ausbildung einrichten')) +
      (vergangene.length ? '<details class="lw-past-exams"><summary>Vergangene Prüfungen (' +
        vergangene.length + ')</summary><ul>' + vergangene.slice(-12).reverse().map(item =>
          '<li><button type="button" data-lw-open="' + esc(item.id) + '"><span>' + esc(item.titel) +
          '</span><time>' + esc(item.datum ? datumText(item.datum) : '') + '</time></button></li>').join('') +
        '</ul></details>' : '') + '</div>';
  };

  const simulationAnsicht = (): string => {
    const simulation = zustand.simulation;
    if (!simulation) return '';
    if (simulation.fertig || simulation.index >= simulation.karten.length) {
      const richtig = simulation.antworten.filter(item => item.richtig).length;
      const gesamt = simulation.antworten.length;
      const quote = gesamt ? Math.round(richtig / gesamt * 100) : 0;
      const themen = new Map<string, { gesamt: number; fehler: number }>();
      simulation.antworten.forEach(item => {
        const wert = themen.get(item.thema) || { gesamt: 0, fehler: 0 };
        wert.gesamt++;
        if (!item.richtig) wert.fehler++;
        themen.set(item.thema, wert);
      });
      return '<div class="lw-simulation lw-simulation-result"><header><span aria-hidden="true">🏁</span>' +
        '<p>Simulation beendet</p><h2>' + esc(simulation.titel) + '</h2><strong>' + quote + ' %</strong></header>' +
        '<section class="lw-metrics">' + kennzahl(richtig + ' / ' + gesamt, 'richtig') +
          kennzahl(String(gesamt - richtig), 'Fehler') +
          kennzahl(Math.max(1, Math.round((Date.now() - simulation.gestartet) / 60000)) + ' Min.', 'Dauer') +
        '</section>' +
        sektion('Themenanalyse', '<ul class="lw-analysis">' + [...themen.entries()].map(([thema, wert]) =>
          '<li><span><strong>' + esc(thema) + '</strong><small>' + wert.fehler + ' Fehler bei ' +
          wert.gesamt + ' Aufgaben</small></span>' + fortschritt(
            wert.gesamt ? Math.round((wert.gesamt - wert.fehler) / wert.gesamt * 100) : 0, thema) +
          '</li>').join('') + '</ul>', 'Ergebnis der Simulation, kein SM-2-Stand') +
        '<div class="lw-actions"><button type="button" data-lw-action="simulation-close">Zur Prüfungszentrale</button>' +
          '<button type="button" class="is-primary" data-lw-simulation-errors="1"' +
          (gesamt === richtig ? ' disabled' : '') + '>Simulationsfehler üben</button></div></div>';
    }
    const card = simulation.karten[simulation.index];
    const [frage, antwort] = kartenTeile(card);
    const rest = Math.max(0, simulation.endet - Date.now());
    const minuten = Math.floor(rest / 60000);
    const sekunden = Math.floor((rest % 60000) / 1000);
    return '<div class="lw-simulation"><header class="lw-session-head"><div><p>' +
      esc(simulation.titel) + '</p><h2>Aufgabe ' + (simulation.index + 1) + ' von ' + simulation.karten.length +
      '</h2></div><time aria-label="Verbleibende Zeit">' + String(minuten).padStart(2, '0') + ':' +
      String(sekunden).padStart(2, '0') + '</time></header><progress max="' + simulation.karten.length +
      '" value="' + simulation.index + '" aria-label="Prüfungsfortschritt"></progress>' +
      '<article class="lw-study-card"><small>' + esc(themaVon(card)) + '</small><h3>' + esc(frage) + '</h3>' +
      (simulation.aufgedeckt ? '<div class="lw-answer"><span>Richtige Antwort</span><p>' + esc(antwort) + '</p></div>' : '') +
      '</article><div class="lw-actions">' +
      (simulation.aufgedeckt
        ? '<button type="button" data-lw-sim-answer="wrong">Falsch</button>' +
          '<button type="button" class="is-primary" data-lw-sim-answer="right">Richtig</button>'
        : '<button type="button" class="is-primary" data-lw-action="simulation-reveal">Antwort prüfen</button>') +
      '<button type="button" data-lw-card-source="' + esc(card.id) + '">Quelle</button></div>' +
      '<p class="lw-session-note">Simulationsergebnisse verändern den gespeicherten Lernstand nicht.</p></div>';
  };

  const trainingAnsicht = (): string => {
    const training = zustand.training;
    if (!training) return '';
    if (training.index >= training.karten.length) {
      return '<div class="lw-training-result"><span aria-hidden="true">🎉</span><p>Runde abgeschlossen</p><h2>' +
        esc(training.titel) + '</h2><strong>' + training.bewertet + ' Karten bewertet</strong><div class="lw-actions">' +
        '<button type="button" data-lw-action="training-close">Zur Übersicht</button>' +
        '<button type="button" class="is-primary" data-lw-train="today">Nächste Runde</button></div></div>';
    }
    const card = training.karten[training.index];
    const [frage, antwort] = kartenTeile(card);
    const source = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
    return '<div class="lw-training"><header class="lw-session-head"><div><p>' + esc(training.titel) +
      '</p><h2>Karte ' + (training.index + 1) + ' von ' + training.karten.length + '</h2></div>' +
      '<button type="button" data-lw-action="training-close">Beenden</button></header>' +
      '<progress max="' + training.karten.length + '" value="' + training.index +
      '" aria-label="Lernfortschritt"></progress><article class="lw-study-card"><small>' +
      esc(themaVon(card)) + '</small><h3>' + esc(frage) + '</h3>' +
      (training.aufgedeckt ? '<div class="lw-answer"><span>Antwort</span><p>' + esc(antwort) + '</p></div>' : '') +
      (source ? '<button type="button" class="lw-source" data-lw-card-source="' + esc(card.id) + '">Quelle: ' +
        esc(typeof Learning !== 'undefined' && Learning.sourceLabel ? Learning.sourceLabel(source) : source.label) +
        '</button>' : '') + '</article><div class="lw-rating">' +
      (training.aufgedeckt
        ? [['1', 'Nochmal'], ['2', 'Schwer'], ['3', 'Gut'], ['4', 'Leicht']].map(([note, label]) =>
            '<button type="button" data-lw-rate="' + note + '"' +
            (note === '3' ? ' class="is-primary"' : '') + (training.beschaeftigt ? ' disabled' : '') + '>' +
            label + '</button>').join('')
        : '<button type="button" class="is-primary" data-lw-action="training-reveal">Antwort zeigen</button>') +
      '</div><p class="lw-session-note">Bewertungen werden im persönlichen Lernstand von ' +
      esc(aktor().name) + ' gespeichert.</p></div>';
  };

  const schoolRoot = (): any => alleBloecke().find(block => block.type === 'page' &&
    (block.schoolRoot === true || block.systemRole === 'school-root')) || null;

  const schulSammlungen = (kind = ''): any[] => Object.values<any>(Store.cache.collections)
    .filter(collection => {
      if (kind && collection?.schoolKind !== kind) return false;
      if (!collection?.schoolKind && kind) return false;
      const block = Object.values<any>(Store.cache.blocks).find(item => item?.alive !== false &&
        item.type === 'database' && item.collectionId === collection.id);
      return !block || darfLesen(block);
    });

  const zeilenTitel = (row: any, collection: any): string => {
    const titleKey = schemaSchluessel(collection, 'title');
    return String(row?.text || zeilenWert(row, collection, titleKey) || 'Ohne Titel');
  };

  const sammlungsEintraege = (kind: string, icon: string, limit = 8): LernweltEintrag[] => {
    const ausgabe: LernweltEintrag[] = [];
    schulSammlungen(kind).forEach(collection => Store.rowsOf(collection.id).forEach((row: any) => {
      if (!row || row.alive === false || !darfLesen(row) || !imBereich(row)) return;
      ausgabe.push({
        id: String(row.id),
        titel: zeilenTitel(row, collection),
        icon,
        zeit: String(row.edited || row.created || ''),
        untertitel: String(collection.name || kind),
        bereichIds: direkteBereichIds(row)
      });
    }));
    return ausgabe.slice(0, limit);
  };

  const fachZeilen = (): Array<{ row: any; collection: any; titel: string }> => {
    const ausgabe: Array<{ row: any; collection: any; titel: string }> = [];
    schulSammlungen('subjects').forEach(collection => Store.rowsOf(collection.id).forEach((row: any) => {
      if (!row || row.alive === false || !darfLesen(row) || !imBereich(row)) return;
      ausgabe.push({ row, collection, titel: zeilenTitel(row, collection) });
    }));
    return ausgabe;
  };

  const beziehtSichAuf = (record: any, id: string, titel: string): boolean => {
    const suchtext = JSON.stringify(record?.props || record || '').toLowerCase();
    return suchtext.includes(id.toLowerCase()) || (titel.length > 2 && suchtext.includes(titel.toLowerCase()));
  };

  const fachAnsicht = (fach: { row: any; collection: any; titel: string }): string => {
    const karten = lernkarten().filter(card => fachVon(card).toLowerCase().includes(fach.titel.toLowerCase()) ||
      beziehtSichAuf(card, fach.row.id, fach.titel));
    const fachFehler = fehlerListe().filter(item => karten.some(card => card.id === item.card.id));
    const fachAufgaben = sichtbareAufgaben().filter(item => {
      const row = Store.getBlock(item.id);
      return beziehtSichAuf(row || item, fach.row.id, fach.titel) ||
        item.quelle.toLowerCase().includes(fach.titel.toLowerCase());
    });
    const fachPruefungen = pruefungen().filter(item =>
      item.fach.toLowerCase().includes(fach.titel.toLowerCase()) ||
      item.lernstoff.toLowerCase().includes(fach.titel.toLowerCase()));
    const fachPdfs = sichtbarePdfs().filter(item => {
      const page = Store.getBlock(item.id);
      return beziehtSichAuf(page || item, fach.row.id, fach.titel) ||
        item.titel.toLowerCase().includes(fach.titel.toLowerCase());
    });
    const fachNotizen = dokumente().filter(item => item.titel.toLowerCase().includes(fach.titel.toLowerCase()));
    const fort = karten.length
      ? Math.round(karten.reduce((summe, card) => summe + Math.min(2, zahl(card?.sr?.wdh)), 0) /
        (karten.length * 2) * 100)
      : 0;
    return '<div class="lw-subject"><header class="lw-page-head"><div><button type="button" class="lw-back" ' +
      'data-lw-action="subject-back">← Schule / Ausbildung</button><p>Fach</p><h2>' + esc(fach.titel) +
      '</h2><span>Eine Fachseite, dieselben Notizen, PDFs, Aufgaben und Karten.</span></div>' +
      '<button type="button" data-lw-open="' + esc(fach.row.id) + '">Datensatz öffnen</button></header>' +
      '<section class="lw-metrics">' + kennzahl(String(karten.length), 'Lernkarten') +
        kennzahl(String(fachAufgaben.filter(item => !item.fertig).length), 'offene Aufgaben') +
        kennzahl(String(fachPruefungen.length), 'Prüfungen') +
        kennzahl(String(fachFehler.filter(item => !item.stabil).length), 'aktive Fehler') + '</section>' +
      fortschritt(fort, 'Fachlicher Fortschritt') +
      '<div class="lw-dashboard-grid">' +
        sektion('Unterricht & Notizen', eintragListe(fachNotizen.slice(0, 8), 'Noch keine Notiz diesem Fach zugeordnet.')) +
        sektion('PDFs & Material', eintragListe(fachPdfs.slice(0, 8), 'Noch kein PDF diesem Fach zugeordnet.')) +
        sektion('Aufgaben', aufgabenListe(fachAufgaben.slice(0, 8), 'Keine Fachaufgabe gefunden.')) +
        sektion('Prüfungen', fachPruefungen.length ? '<ul class="lw-object-list">' + fachPruefungen.map(item =>
          '<li><button type="button" data-lw-exam="' + esc(item.id) + '"><span class="lw-object-icon">📝</span>' +
          '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.datum ? datumText(item.datum) :
            'Termin offen') + '</small></span><span>›</span></button></li>').join('') + '</ul>' :
          '<p class="lw-none">Keine Prüfung für dieses Fach gefunden.</p>') +
        sektion('Fehler', fachFehler.length ? '<ul class="lw-compact-errors">' + fachFehler.slice(0, 8).map(item =>
          '<li><button type="button" data-lw-train-card="' + esc(item.card.id) + '"><span>' +
          (item.stabil ? '✓' : '!') + '</span><strong>' + esc(item.frage) + '</strong><small>' + item.anzahl +
          ' Fehler</small></button></li>').join('') + '</ul>' : '<p class="lw-none">Keine Fehler in diesem Fach.</p>') +
      '</div></div>';
  };

  const schuleAnsicht = (): string => {
    const root = schoolRoot();
    /* DIE LEERE WAND STAND AUCH VOR VOLLEN REGALEN (E143).
       `schoolRoot()` sucht eine Seite mit der Marke `schoolRoot` — die setzt
       nur die Einrichtung. Wer seine Fächer, Noten und Karteikarten von Hand
       angelegt hat, bekam „Ausbildung noch nicht eingerichtet" und sonst
       nichts. Sein Bestand war da; die Ansicht schaute nur an einer einzigen
       Stelle nach und gab auf.

       Das widerspricht §51 des Auftrags („ein Objekt, viele Ansichten"):
       eine Ansicht ist ein BLICK auf vorhandene Objekte, keine Belohnung
       fürs Drücken eines Knopfes.

       Die Wand bleibt — aber nur, wenn wirklich nichts da ist. */
    /* `schulSammlungen()` OHNE ARGUMENT LIEFERT ALLE SAMMLUNGEN. Die zwei
       Bedingungen darin greifen nur, wenn `kind` gesetzt ist — ohne
       Argument fällt jede lesbare Sammlung durch. Meine erste Fassung
       zählte deshalb „Meine Aufgaben" aus dem Beispielinhalt als
       schulischen Bestand, und die Einladung war nie zu sehen.
       Zweimal geraten, zweimal daneben; erst das Messen der vier Werte
       einzeln hat es gezeigt. */
    const schonDa = !root && (schulSammlungen().some(sammlung => sammlung?.schoolKind) ||
      pruefungen().length > 0 || lernkarten().length > 0 || fachZeilen().length > 0);
    if (!root && !schonDa) return '<div class="lw-school">' + leer('🎓', 'Ausbildung noch nicht eingerichtet',
      'Die additive Vorlage erstellt normale Seiten und Datenbanken für Fächer, Prüfungen, Noten und Material.',
      'school-install', 'Ausbildung einrichten') + '</div>';
    const faecher = fachZeilen();
    const fokus = faecher.find(item => item.row.id === zustand.fachId);
    if (fokus) return fachAnsicht(fokus);
    const tasks = sichtbareAufgaben().filter(item => !item.fertig).slice(0, 8);
    const exams = pruefungen().filter(item => item.tage === null || item.tage >= 0).slice(0, 6);
    const themen = liste(statistik().topics).slice(0, 8);
    const gradeEntries = sammlungsEintraege('grades', '🏅', 6);
    const reportEntries = sammlungsEintraege('reports', '📓', 6);
    const materialEntries = sammlungsEintraege('materials', '📚', 8);
    /* Ohne Ausbildungsseite gibt es nichts zu öffnen — dort steht statt des
       Knopfes das Angebot, die Vorlage nachzuziehen. */
    return '<div class="lw-school"><header class="lw-page-head"><div><p>Schule / Ausbildung</p><h2>' +
      esc(root?.text || 'Ausbildung') + '</h2><span>Fächer, Unterricht, Material und Lernen in einer gemeinsamen Sicht.</span></div>' +
      '<div class="lw-actions"><button type="button" data-lw-action="capture">Material erfassen</button>' +
      (root
        ? '<button type="button" data-lw-open="' + esc(root.id) + '">Ausbildungsseite öffnen</button>'
        : '<button type="button" class="is-primary" data-lw-action="school-install">Ausbildung einrichten</button>') +
      '</div></header>' +
      (root ? '' : '<aside class="lw-note"><strong>Das hier kommt aus deinem vorhandenen Bestand.</strong>' +
        '<p>Eine Ausbildungsseite gibt es noch nicht. Die Vorlage legt sie zusätzlich an — ' +
        'sie ersetzt nichts und löscht nichts.</p></aside>') +
      /* OHNE FÄCHERDATENBANK GAR KEIN FÄCHERKASTEN. `fachZeilen()` liest die
         Sammlung `subjects` aus der Vorlage. Fehlt sie, stand „Noch keine
         Fächer angelegt" — direkt über „Aktuelle Themen", wo Betriebskunde,
         Deutsch und Elektrotechnik untereinander aufgelistet waren.

         Zwei Sätze auf einem Bildschirm, die einander widersprechen, sind
         schlimmer als ein fehlender: der eine sagt, es gebe nichts, der
         andere zeigt es. Ohne Ausbildungsseite übernimmt der Themenkasten
         die Aufgabe, und der leere Kasten entfällt. */
      (faecher.length || root ? '<section class="lw-subject-grid" aria-label="Fächer">' +
        (faecher.length ? faecher.map(item => {
          const cards = lernkarten().filter(card => fachVon(card).toLowerCase().includes(item.titel.toLowerCase()));
          const progress = cards.length
            ? Math.round(cards.reduce((summe, card) => summe + Math.min(2, zahl(card?.sr?.wdh)), 0) /
              (cards.length * 2) * 100)
            : 0;
          return '<button type="button" data-lw-subject="' + esc(item.row.id) + '"><span aria-hidden="true">📘</span>' +
            '<strong>' + esc(item.titel) + '</strong><small>' + cards.length + ' Karten · ' + progress +
            ' %</small><progress max="100" value="' + progress + '" aria-label="Fortschritt ' +
            esc(item.titel) + '"></progress></button>';
        }).join('') : '<div class="lw-subject-empty"><p>Noch keine Fächer angelegt.</p>' +
          '<button type="button" data-lw-open="' + esc(root?.id || '') + '">Fächer hinzufügen</button>' +
          '</div>') + '</section>' : '') +
      '<div class="lw-dashboard-grid">' +
        sektion('Aktuelle Themen', themenListe(themen, 8), 'aus deinen Lernkarten') +
        sektion('Aufgaben', aufgabenListe(tasks, 'Keine offene Ausbildungsaufgabe.')) +
        sektion('Prüfungen', exams.length ? '<ul class="lw-object-list">' + exams.map(item =>
          '<li><button type="button" data-lw-exam="' + esc(item.id) + '"><span class="lw-object-icon">📝</span>' +
          '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.datum ? datumText(item.datum) :
          'Termin offen') + '</small></span><span>›</span></button></li>').join('') + '</ul>' :
          '<p class="lw-none">Keine Prüfung geplant.</p>') +
        sektion('Material & PDFs', eintragListe(eindeutige([...materialEntries, ...sichtbarePdfs()], item => item.id)
          .slice(0, 8), 'Noch kein Lernmaterial abgelegt.')) +
        sektion('Noten', eintragListe(gradeEntries, 'Noch keine Note eingetragen.')) +
        sektion('Berichtsheft', eintragListe(reportEntries, 'Noch kein Berichtsheft-Eintrag.')) +
      '</div><div class="lw-quick">' +
        (root ? '<button type="button" data-lw-open="' + esc(root.id) + '">📅 Stundenplan</button>' : '') +
        '<button type="button" data-lw-nav="lernen">🎴 Lernkarten</button>' +
        '<button type="button" data-lw-nav="fortschritt">📈 Lernfortschritt</button></div></div>';
  };

  const passendeBereiche = (art: string): LernweltBereich[] => bereiche().filter(item => {
    const text = (item.art + ' ' + item.name).toLowerCase();
    return art === 'uni' ? /uni|stud|hochschule|semester/.test(text) : /arbeit|work|beruf|firma/.test(text);
  });

  const domainingEintraege = (muster: RegExp, icon: string, limit = 12): LernweltEintrag[] => {
    const ausgabe: LernweltEintrag[] = [];
    alleBloecke().filter(block => block.type === 'page' && imBereich(block)).forEach(page => {
      const text = [page.text, page.systemRole, page.art, page.kind, ...textListe(page.tags)].join(' ');
      if (!muster.test(text)) return;
      ausgabe.push({
        id: String(page.id),
        titel: String(page.text || 'Ohne Titel'),
        icon: String(page.icon || icon),
        zeit: String(page.edited || page.created || ''),
        untertitel: 'Gemeinsame Redion-Seite',
        bereichIds: direkteBereichIds(page)
      });
    });
    Object.values<any>(Store.cache.collections).forEach(collection => {
      if (!muster.test(String(collection?.name || ''))) return;
      Store.rowsOf(collection.id).forEach((row: any) => {
        if (!row || row.alive === false || !darfLesen(row) || !imBereich(row)) return;
        ausgabe.push({
          id: String(row.id),
          titel: zeilenTitel(row, collection),
          icon,
          zeit: String(row.edited || row.created || ''),
          untertitel: String(collection.name || ''),
          bereichIds: direkteBereichIds(row)
        });
      });
    });
    return eindeutige(ausgabe, item => item.id).slice(0, limit);
  };

  const uniAnsicht = (): string => {
    const uniBereiche = passendeBereiche('uni');
    const module = domainingEintraege(/semester|modul|vorlesung|übung|uebung|literatur|studium/i, '🏛️');
    const tasks = sichtbareAufgaben().filter(item => !item.fertig).slice(0, 8);
    const exams = pruefungen().filter(item => item.tage === null || item.tage >= 0).slice(0, 6);
    return '<div class="lw-domain"><header class="lw-page-head"><div><p>Uni</p><h2>Studium im selben Workspace</h2>' +
      '<span>Semester, Module, Vorlesungen und Literatur sind Ansichten auf normale Redion-Objekte.</span></div>' +
      '<button type="button" data-lw-action="new-page">Neue Studiennotiz</button></header>' +
      (!uniBereiche.length && zustand.bereichId === 'alle'
        ? '<aside class="lw-note"><strong>Noch kein Uni-Bereich zugeordnet.</strong><p>Du kannst vorhandene Seiten später einem Uni-Bereich zuordnen – ohne sie zu kopieren.</p></aside>'
        : '') +
      '<div class="lw-dashboard-grid">' +
        sektion('Semester & Module', eintragListe(module, 'Noch kein Semester oder Modul gefunden.'),
          'Seiten und Datenbankzeilen') +
        sektion('Vorlesungen & Notizen', eintragListe(dokumente().slice(0, 10), 'Noch keine Studiennotiz.'),
          'zuletzt bearbeitet') +
        sektion('Übungen & Aufgaben', aufgabenListe(tasks, 'Keine offene Übung oder Aufgabe.')) +
        sektion('Prüfungen', exams.length ? '<ul class="lw-object-list">' + exams.map(item =>
          '<li><button type="button" data-lw-exam="' + esc(item.id) + '"><span class="lw-object-icon">📝</span>' +
          '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.fach || datumText(item.datum)) +
          '</small></span><span>›</span></button></li>').join('') + '</ul>' : '<p class="lw-none">Keine Prüfung geplant.</p>') +
        sektion('Literatur & PDFs', eintragListe(sichtbarePdfs(), 'Noch keine Literatur oder PDF zugeordnet.')) +
        sektion('Lernkarten', themenListe(liste(statistik().topics), 8), 'persönlicher Lernstand') +
      '</div></div>';
  };

  const arbeitAnsicht = (): string => {
    const arbeitBereiche = passendeBereiche('arbeit');
    const meetings = alleBloecke().filter(block => block.type === 'page' && block.besprechung && imBereich(block))
      .sort((a, b) => String(b.created || '').localeCompare(String(a.created || ''))).slice(0, 8)
      .map(page => ({
        id: String(page.id), titel: String(page.text || 'Meeting'), icon: String(page.icon || '🎙'),
        zeit: String(page.created || ''), untertitel: 'Meeting-Notiz', bereichIds: direkteBereichIds(page)
      } as LernweltEintrag));
    const wissen = domainingEintraege(/entscheidung|wissensbasis|knowledge|offene punkte|projekt/i, '💼');
    return '<div class="lw-domain"><header class="lw-page-head"><div><p>Arbeit</p><h2>Projekte, Meetings und Wissen</h2>' +
      '<span>Professionelle Arbeitssicht auf dieselben Seiten, Aufgaben, Termine und Dateien.</span></div>' +
      '<div class="lw-actions"><button type="button" data-lw-action="meeting">Meeting-Notiz</button>' +
      '<button type="button" data-lw-action="new-page">Neue Arbeitsnotiz</button></div></header>' +
      (!arbeitBereiche.length && zustand.bereichId === 'alle'
        ? '<aside class="lw-note"><strong>Noch kein Arbeitsbereich zugeordnet.</strong><p>Ordne bestehende Projekte und Dokumente einem Arbeitsbereich zu, statt Kopien anzulegen.</p></aside>'
        : '') +
      '<div class="lw-dashboard-grid">' +
        sektion('Projekte', eintragListe(sichtbareProjekte(), 'Noch kein laufendes Projekt zugeordnet.')) +
        sektion('Offene Aufgaben', aufgabenListe(sichtbareAufgaben().filter(item => !item.fertig).slice(0, 10),
          'Keine offene Arbeitsaufgabe.')) +
        sektion('Meetings', eintragListe(meetings, 'Noch keine Meeting-Notiz.'), 'bestehendes Besprechungssystem') +
        sektion('Termine', terminListe(sichtbareTermine().slice(0, 8), 'Kein Arbeitstermin gefunden.')) +
        sektion('Dokumente & PDFs', eintragListe(eindeutige([...sichtbarePdfs(), ...dokumente()], item => item.id)
          .slice(0, 10), 'Noch kein Dokument zugeordnet.')) +
        sektion('Wissensbasis & Entscheidungen', eintragListe(wissen, 'Noch keine Entscheidung oder Wissensseite gefunden.')) +
      '</div></div>';
  };

  const fortschrittAnsicht = (): string => {
    const stats = statistik();
    const spiel = aktivitaet();
    const stabil = lernkarten().filter(card => zahl(card?.sr?.wdh) >= 2).length;
    const wissen = stats.total ? Math.round(lernkarten().reduce((summe, card) =>
      summe + Math.min(2, zahl(card?.sr?.wdh)), 0) / (stats.total * 2) * 100) : 0;
    return '<div class="lw-progress-page"><header class="lw-page-head"><div><p>Fortschritt</p><h2>Wissen nachvollziehbar messen</h2>' +
      '<span>SM-2-Wissensstand und Motivation werden bewusst getrennt dargestellt.</span></div></header>' +
      '<section class="lw-knowledge"><header><div><p>Fachlicher Stand</p><h3>Persönlicher Lernfortschritt</h3></div>' +
        '<strong>' + wissen + ' %</strong></header>' + fortschritt(wissen, 'Gesamter Wissensstand') +
        '<div class="lw-metrics">' + kennzahl(stabil + ' / ' + stats.total, 'stabile Karten') +
          kennzahl(String(stats.due), 'aktuell fällig') + kennzahl(String(stats.mistakes), 'Themen mit Fehlern') +
          kennzahl(stats.nextAt ? datumText(stats.nextAt, true) : '—', 'nächster Termin') + '</div></section>' +
      '<section class="lw-engagement"><header><div><p>Aktivität</p><h3>Routine &amp; Motivation</h3></div>' +
        '<span>kein fachlicher Nachweis</span></header><div class="lw-metrics">' +
        kennzahl('~' + spiel.minuten + ' Min.', 'Lernzeit') + kennzahl(String(spiel.woche), 'Wiederholungen diese Woche') +
        kennzahl(spiel.streak + ' Tage', 'Streak') + kennzahl(String(spiel.xp), 'Aktivitäts-XP') +
        kennzahl(String(spiel.level), 'Level') + '</div>' + fortschritt(spiel.wochenProzent, 'Wochenziel') + '</section>' +
      '<div class="lw-dashboard-grid">' +
        sektion('Themenfortschritt', themenListe(liste(stats.topics), 40), 'SM-2, nicht XP') +
        sektion('Wochenverlauf', historie(liste(stats.logs), 7), stats.reviewedToday + ' heute') +
        sektion('Monatsverlauf', historie(liste(stats.logs), 30), spiel.monat + ' Wiederholungen im Monat') +
      '</div><aside class="lw-note"><strong>So wird gerechnet</strong><p>Eine begonnene Karte zählt halb, ab zwei erfolgreichen Wiederholungen stabil. Ein Fehler setzt die Wiederholungsstufe wie im bestehenden SM-2-Verfahren zurück. Aktivitäts-XP verändert diese Zahl nie.</p></aside></div>';
  };

  const ansichtsInhalt = (): string => {
    if (zustand.training) return trainingAnsicht();
    if (zustand.simulation) return simulationAnsicht();
    switch (zustand.ansicht) {
      case 'heute': return heuteAnsicht();
      case 'lernen': return lernzentrumAnsicht();
      case 'lernweg': return lernpfadAnsicht();
      case 'fehler': return fehlerAnsicht();
      case 'pruefungen': return pruefungenAnsicht();
      case 'schule': return schuleAnsicht();
      case 'uni': return uniAnsicht();
      case 'arbeit': return arbeitAnsicht();
      case 'fortschritt': return fortschrittAnsicht();
    }
    return heuteAnsicht();
  };

  const timerStoppen = (): void => {
    if (zustand.timer !== null) window.clearInterval(zustand.timer);
    zustand.timer = null;
  };

  const simulationZeitAktualisieren = (): void => {
    const simulation = zustand.simulation;
    if (!simulation || simulation.fertig) { timerStoppen(); return; }
    if (!zustand.root?.querySelector('.lernwelt, .lw-main')) { timerStoppen(); return; }
    const rest = Math.max(0, simulation.endet - Date.now());
    if (rest <= 0) {
      simulation.fertig = true;
      zeichnen();
      return;
    }
    const uhr = zustand.root.querySelector<HTMLElement>('.lw-session-head time');
    if (uhr) uhr.textContent = String(Math.floor(rest / 60000)).padStart(2, '0') + ':' +
      String(Math.floor((rest % 60000) / 1000)).padStart(2, '0');
  };

  const timerStarten = (): void => {
    timerStoppen();
    if (!zustand.simulation || zustand.simulation.fertig) return;
    zustand.timer = window.setInterval(simulationZeitAktualisieren, 1000);
  };

  const zeichnen = (): void => {
    const root = zustand.root;
    if (!root) return;
    root.className = 'produkt-welt lernwelt';
    root.dataset.lwView = zustand.ansicht;
    root.innerHTML = kopf() + '<main class="lw-main" id="lernwelt-inhalt" tabindex="-1">' +
      ansichtsInhalt() + '</main>';
    if (zustand.simulation && !zustand.simulation.fertig) timerStarten();
    else timerStoppen();
    reiterRollstand();
    ladeBereichsdaten();
  };

  /**
   * Die Reiterleiste sagt, dass es weitergeht.
   *
   * Am Telefon passen von neun Reitern drei; die Leiste rollt seitwärts, aber
   * NICHTS zeigte das an — gemessen am 25. August auf 390 px: 883 px Inhalt
   * in 364 px Breite, und „Meine Fehler" endete mitten im Wort am Bildrand.
   * Ein abgeschnittenes Wort sieht aus wie ein Fehler, nicht wie eine
   * Einladung zum Wischen.
   *
   * Dieselbe Lösung wie bei der Markierungsleiste im PDF (E141): ein
   * Datenmerkmal, aus dem die CSS einen Schatten an der jeweiligen Kante
   * macht. Kein Knopf, kein Pfeil, nichts zum Danebentippen.
   */
  const reiterRollstand = (): void => {
    const leiste = zustand.root?.querySelector<HTMLElement>('.lw-nav');
    if (!leiste) return;
    const stand = (): void => {
      const links = leiste.scrollLeft > 2;
      const rechts = leiste.scrollLeft + leiste.clientWidth < leiste.scrollWidth - 2;
      leiste.dataset['mehr'] = links && rechts ? 'beides' : rechts ? 'rechts' : links ? 'links' : 'nein';
    };
    leiste.addEventListener('scroll', stand, { passive: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(stand).observe(leiste);
    stand();
  };

  const ansichtGueltig = (wert: unknown): wert is LernweltAnsicht =>
    ANSICHTEN.some(item => item.id === wert);

  const wechseln = (ansicht: LernweltAnsicht): void => {
    zustand.ansicht = ansicht;
    zustand.training = null;
    zustand.simulation = null;
    zustand.fachId = ansicht === 'schule' ? zustand.fachId : '';
    zustand.extern = null;
    zustand.ladeSchluessel = '';
    Store.setMeta(metaSchluessel('ansicht'), ansicht);
    zeichnen();
    zustand.root?.querySelector<HTMLElement>('#lernwelt-inhalt')?.focus();
  };

  const mischen = (karten: any[], limit: number): any[] => {
    if (!karten.length) return [];
    const schluessel = Number(tag(new Date()).replace(/-/g, '')) || 1;
    return [...karten].sort((a, b) => {
      const aWert = [...String(a.id || '')].reduce((summe, zeichen) => summe + (zeichen.codePointAt(0) || 0), schluessel);
      const bWert = [...String(b.id || '')].reduce((summe, zeichen) => summe + (zeichen.codePointAt(0) || 0), schluessel);
      return aWert - bWert || String(a.id).localeCompare(String(b.id));
    }).slice(0, Math.max(1, limit));
  };

  const trainingStarten = (art: string, einzelneId = ''): void => {
    const queue = warteschlange();
    let karten: any[] = [];
    let titel = 'Lernrunde';
    if (art === 'today') { karten = queue.all; titel = 'Tagesrunde'; }
    if (art === 'errors') {
      karten = fehlerListe().filter(item => !item.stabil).map(item => item.card);
      titel = 'Fehlertraining';
    }
    if (art === 'new') { karten = queue.newCards; titel = 'Neue Karten'; }
    if (art === 'topic') {
      karten = lernkarten().filter(card => themaVon(card).toLowerCase() === String(zustand.themaId).toLowerCase() ||
        themaVon(card).toLocaleLowerCase('de-CH').replace(/[^a-z0-9]+/g, '-') === zustand.themaId);
      const thema = liste(statistik().topics).find(item => item.id === zustand.themaId);
      titel = thema ? 'Thema: ' + thema.label : 'Themenrunde';
    }
    if (art === 'exam') {
      const naechste = pruefungen().find(item => item.tage !== null && item.tage >= 0)
        || pruefungen().find(item => item.tage === null) || null;
      karten = naechste ? nurPassendeKarten(naechste) : [];
      titel = naechste ? 'Prüfungsfokus: ' + naechste.titel : 'Prüfungsfokus';
    }
    if (art === 'single') {
      const card = lernkarten().find(item => String(item.id) === einzelneId);
      karten = card ? [card] : [];
      titel = 'Einzelfehler';
    }
    if (!karten.length) { UI.toast('Für diese Runde gibt es gerade keine Karten.'); return; }
    zustand.simulation = null;
    zustand.training = {
      titel,
      karten: karten.map(karteMitStand),
      index: 0,
      aufgedeckt: false,
      bewertet: 0,
      beschaeftigt: false
    };
    zeichnen();
  };

  const simulationStarten = (id: string): void => {
    const pruefung = pruefungen().find(item => item.id === id) || null;
    const karten = pruefung ? passendeKarten(pruefung) : lernkarten();
    const anzahl = Math.min(pruefung ? 30 : 15, karten.length);
    if (!anzahl) { UI.toast('Für eine Simulation fehlen noch Lernkarten.'); return; }
    const dauer = pruefung?.dauer || Math.max(10, anzahl * 2);
    const gestartet = Date.now();
    zustand.training = null;
    zustand.simulation = {
      titel: pruefung?.titel || 'Wochenprüfung',
      karten: mischen(karten, anzahl),
      index: 0,
      aufgedeckt: false,
      gestartet,
      endet: gestartet + dauer * 60000,
      antworten: [],
      fertig: false
    };
    zustand.ansicht = 'pruefungen';
    zeichnen();
  };

  const neuZuordnen = async (record: any): Promise<void> => {
    if (!record || zustand.bereichId === 'alle') return;
    const api = lebensbereiche();
    if (!api || typeof api.zuordnen !== 'function') return;
    try { await api.zuordnen({ art: 'page', id: String(record.id) }, zustand.bereichId); }
    catch { UI.toast('Die Bereichszuordnung konnte nicht gespeichert werden.'); }
  };

  const externOeffnen = (id: string): void => {
    if (!id) return;
    abmelden();
    App.oeffne(id);
  };

  const quelleOeffnen = (cardId: string): void => {
    const card = Store.getBlock(cardId);
    if (!card) return;
    abmelden();
    if (typeof Learning !== 'undefined' && Learning.jumpToSource) Learning.jumpToSource(card);
    else App.zeigeBlock(card.id);
  };

  const aktionAusfuehren = async (aktion: string): Promise<void> => {
    if (aktion === 'goal') {
      const antwort = await UI.frage('Wie viele Karten möchtest du täglich wiederholen?', String(tagesziel()));
      const neu = Math.max(1, Math.min(500, Math.round(zahl(antwort, tagesziel()))));
      Store.setMeta(metaSchluessel('tagesziel'), neu);
      zeichnen();
      return;
    }
    if (aktion === 'training-reveal' && zustand.training) {
      zustand.training.aufgedeckt = true; zeichnen(); return;
    }
    if (aktion === 'training-close') {
      zustand.training = null; zeichnen(); return;
    }
    if (aktion === 'simulation-reveal' && zustand.simulation) {
      zustand.simulation.aufgedeckt = true; zeichnen(); return;
    }
    if (aktion === 'simulation-close') {
      zustand.simulation = null; zeichnen(); return;
    }
    if (aktion === 'subject-back') {
      zustand.fachId = ''; zeichnen(); return;
    }
    if (aktion === 'nav-lernen') { wechseln('lernen'); return; }
    if (aktion === 'tasks') { abmelden(); Bibliothek.aufgaben(); return; }
    if (aktion === 'library') { abmelden(); Bibliothek.oeffne(); return; }
    if (aktion === 'calendar') {
      if (typeof Kalender !== 'undefined' && Kalender.dialog) Kalender.dialog();
      else UI.toast('Der Kalender ist noch nicht verfügbar.');
      return;
    }
    if (aktion === 'capture') {
      if (typeof Recognition !== 'undefined' && Recognition.scan) Recognition.scan();
      else UI.toast('Die Erfassung ist noch nicht verfügbar.');
      return;
    }
    if (aktion === 'meeting') {
      if (typeof Meeting !== 'undefined' && Meeting.panel) Meeting.panel();
      else UI.toast('Besprechungen sind noch nicht verfügbar.');
      return;
    }
    if (aktion === 'learning-classic') {
      if (typeof Learning !== 'undefined' && Learning.open) Learning.open();
      return;
    }
    if (aktion === 'school-setup') { wechseln('schule'); return; }
    if (aktion === 'school-install') {
      if (typeof Galerie === 'undefined' || !Galerie.bauen) return;
      const page = Galerie.bauen('ausbildung');
      if (page) { App.zeichneBaum(); zustand.fachId = ''; zeichnen(); }
      return;
    }
    if (aktion === 'new-page') {
      const titel = zustand.ansicht === 'uni' ? 'Studiennotiz' : 'Arbeitsnotiz';
      const icon = zustand.ansicht === 'uni' ? '🏛️' : '💼';
      const page = Store.addPage(null, { text: titel, icon });
      await neuZuordnen(page);
      externOeffnen(page.id);
    }
  };

  const klick = (event: Event): void => {
    const element = event.target instanceof Element ? event.target : null;
    if (!element) return;
    const nav = element.closest<HTMLElement>('[data-lw-nav]');
    const navId = nav?.dataset.lwNav;
    if (ansichtGueltig(navId)) { wechseln(navId); return; }
    const open = element.closest<HTMLElement>('[data-lw-open]');
    if (open?.dataset.lwOpen) { externOeffnen(open.dataset.lwOpen); return; }
    const action = element.closest<HTMLElement>('[data-lw-action]');
    if (action?.dataset.lwAction) { void aktionAusfuehren(action.dataset.lwAction); return; }
    const train = element.closest<HTMLElement>('[data-lw-train]');
    if (train?.dataset.lwTrain) { trainingStarten(train.dataset.lwTrain); return; }
    const trainCard = element.closest<HTMLElement>('[data-lw-train-card]');
    if (trainCard?.dataset.lwTrainCard) { trainingStarten('single', trainCard.dataset.lwTrainCard); return; }
    const source = element.closest<HTMLElement>('[data-lw-card-source]');
    if (source?.dataset.lwCardSource) { quelleOeffnen(source.dataset.lwCardSource); return; }
    const topic = element.closest<HTMLElement>('[data-lw-topic]');
    if (topic?.dataset.lwTopic) {
      zustand.themaId = topic.dataset.lwTopic;
      wechseln('lernen');
      return;
    }
    const pathTopic = element.closest<HTMLElement>('[data-lw-path-topic]');
    if (pathTopic?.dataset.lwPathTopic) {
      zustand.themaId = pathTopic.dataset.lwPathTopic;
      zustand.ansicht = 'lernen';
      trainingStarten('topic');
      return;
    }
    const subject = element.closest<HTMLElement>('[data-lw-subject]');
    if (subject?.dataset.lwSubject) { zustand.fachId = subject.dataset.lwSubject; zeichnen(); return; }
    const exam = element.closest<HTMLElement>('[data-lw-exam]');
    if (exam?.dataset.lwExam) {
      zustand.ansicht = 'pruefungen';
      zustand.simulation = null;
      zeichnen();
      const ziel = [...(zustand.root?.querySelectorAll<HTMLElement>('[data-lw-simulate]') || [])]
        .find(button => button.dataset.lwSimulate === exam.dataset.lwExam);
      ziel?.focus();
      return;
    }
    const simulate = element.closest<HTMLElement>('[data-lw-simulate]');
    if (simulate?.dataset.lwSimulate) { simulationStarten(simulate.dataset.lwSimulate); return; }
    const simAnswer = element.closest<HTMLElement>('[data-lw-sim-answer]');
    if (simAnswer?.dataset.lwSimAnswer && zustand.simulation) {
      const card = zustand.simulation.karten[zustand.simulation.index];
      zustand.simulation.antworten.push({
        cardId: String(card.id),
        richtig: simAnswer.dataset.lwSimAnswer === 'right',
        thema: themaVon(card)
      });
      zustand.simulation.index++;
      zustand.simulation.aufgedeckt = false;
      if (zustand.simulation.index >= zustand.simulation.karten.length) zustand.simulation.fertig = true;
      zeichnen();
      return;
    }
    const simErrors = element.closest<HTMLElement>('[data-lw-simulation-errors]');
    if (simErrors && zustand.simulation) {
      const ids = new Set(zustand.simulation.antworten.filter(item => !item.richtig).map(item => item.cardId));
      const karten = zustand.simulation.karten.filter(card => ids.has(String(card.id)));
      zustand.simulation = null;
      zustand.training = {
        titel: 'Fehler aus der Simulation', karten, index: 0, aufgedeckt: false, bewertet: 0, beschaeftigt: false
      };
      zeichnen();
      return;
    }
    if (element.closest<HTMLElement>('[data-lw-action="setup"]')) {
      const modul = (globalThis as any).ProduktOnboarding;
      if (modul?.oeffnen) void modul.oeffnen().then(() => zeichnen());
      return;
    }
    const rate = element.closest<HTMLElement>('[data-lw-rate]');
    if (rate?.dataset.lwRate && zustand.training && !zustand.training.beschaeftigt) {
      const note = zahl(rate.dataset.lwRate);
      const training = zustand.training;
      const card = training.karten[training.index];
      training.beschaeftigt = true;
      zeichnen();
      void karteBewerten(card, note).then(() => {
        if (zustand.training !== training) return;
        training.bewertet++;
        training.index++;
        training.aufgedeckt = false;
        training.beschaeftigt = false;
        zeichnen();
      }).catch((fehler: unknown) => {
        training.beschaeftigt = false;
        UI.banner(fehler instanceof Error ? fehler.message : String(fehler), 'warn');
        zeichnen();
      });
    }
  };

  const aenderung = (event: Event): void => {
    const select = event.target instanceof HTMLSelectElement && event.target.matches('[data-lw-area]')
      ? event.target
      : null;
    if (!select) return;
    const gueltig = bereiche().some(item => item.id === select.value);
    zustand.bereichId = gueltig ? select.value : 'alle';
    zustand.extern = null;
    zustand.ladeSchluessel = '';
    zustand.fachId = '';
    zustand.themaId = '';
    Store.setMeta(metaSchluessel('bereich'), zustand.bereichId);
    zeichnen();
  };

  /**
   * Tastenkürzel in der Lernrunde: Leertaste deckt auf, 1 bis 4 bewerten.
   *
   * DER HORCHER HÄNGT AM DOKUMENT, NICHT AN DER WURZEL (E136).
   *
   * Vorher stand er auf `zustand.root`. Ereignisse steigen aber AUFWÄRTS,
   * nicht abwärts: gemessen liegt der Fokus nach dem Öffnen auf `BODY`, und
   * body ist der Vorfahr der Wurzel, nicht ihr Nachfahr. Der Tastendruck kam
   * nie an. Bildschirmweise gemessen:
   *
   *     nach Start        Fokus BODY, Karte 1 von 4
   *     Leertaste         nichts — nicht aufgedeckt
   *     Maus aufgedeckt   ja
   *     Taste 3           nichts — immer noch Karte 1 von 4
   *
   * Am Dokument kommt er an. Damit er nicht in fremden Ansichten mitredet,
   * fragt er zuerst, ob die Lernwelt überhaupt noch im Dokument hängt;
   * `abmelden()` nimmt ihn ausserdem wieder ab.
   */
  const taste = (event: KeyboardEvent): void => {
    /* IST DIE LERNWELT ÜBERHAUPT NOCH DIE SICHTBARE ANSICHT?
       `isConnected` allein genügt NICHT, und das wäre beinahe schiefgegangen:
       `zustand.root` ist der wiederverwendete Inhaltsbereich der Schale, und
       der hängt auch dann noch im Dokument, wenn längst eine gewöhnliche
       Seite darin steht. Gemessen: Runde starten, `App.oeffne(seite)`, dann
       im Editor die Leertaste — und die Lernwelt sprang zurück über die
       Seite, in der gerade geschrieben wurde.
       Gefragt wird deshalb nach dem eigenen Markup: steht die Lernwelt noch
       in ihrer Wurzel, gehört die Taste ihr. Sonst nicht. */
    if (!zustand.root?.isConnected) return;
    if (!zustand.root.classList.contains('lernwelt') &&
        !zustand.root.querySelector('.lernwelt')) return;
    const ziel = event.target instanceof HTMLElement ? event.target : null;
    if (ziel?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (!zustand.training) return;

    /* Leertaste und Enter BETÄTIGEN einen Knopf, der den Fokus hat. Läge
       hier kein Vorbehalt, deckte ein Druck auf „Antwort zeigen" die Karte
       zweimal auf — einmal über den Knopf, einmal über das Kürzel. Die
       Ziffern 1 bis 4 betätigen nichts und dürfen deshalb immer. */
    const aufKnopf = !!ziel?.closest('button, a');

    if (!zustand.training.aufgedeckt && !aufKnopf &&
        (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      zustand.training.aufgedeckt = true;
      zeichnen();
      return;
    }
    if (zustand.training.aufgedeckt && /^[1-4]$/.test(event.key)) {
      event.preventDefault();
      zustand.root.querySelector<HTMLElement>('[data-lw-rate="' + event.key + '"]')?.click();
    }
  };

  const abmelden = (): void => {
    timerStoppen();
    zustand.generation++;
    if (zustand.root) {
      zustand.root.removeEventListener('click', klick);
      zustand.root.removeEventListener('change', aenderung);
    }
    document.removeEventListener('keydown', taste);
    zustand.root = null;
  };

  const render = (ziel: HTMLElement, ansicht?: LernweltAnsicht): void => {
    abmelden();
    zustand.root = ziel;
    const gespeichert = Store.getMeta(metaSchluessel('ansicht'), 'heute');
    zustand.ansicht = ansichtGueltig(ansicht) ? ansicht
      : ansichtGueltig(gespeichert) ? gespeichert : 'heute';
    const bereichGespeichert = String(Store.getMeta(metaSchluessel('bereich'), 'alle'));
    zustand.bereichId = bereiche().some(item => item.id === bereichGespeichert) ? bereichGespeichert : 'alle';
    zustand.training = null;
    zustand.simulation = null;
    zustand.extern = null;
    zustand.ladeSchluessel = '';
    ziel.addEventListener('click', klick);
    ziel.addEventListener('change', aenderung);
    /* Am Dokument, nicht am Ziel — siehe `taste`. */
    document.addEventListener('keydown', taste);
    zeichnen();
  };

  const oeffnen = (ansicht: LernweltAnsicht = 'heute'): void => {
    const start = ansichtGueltig(ansicht) ? ansicht : 'heute';
    App.zeigeSonder('Lernen & Alltag', (ziel: HTMLElement) => render(ziel, start));
  };

  const aktualisieren = (): void => {
    zustand.extern = null;
    zustand.ladeSchluessel = '';
    zeichnen();
  };

  return {
    ansichten: ANSICHTEN.map(item => ({ ...item })),
    oeffnen,
    render,
    wechseln,
    aktualisieren,
    zerstoeren: abmelden,
    trainingStarten,
    simulationStarten,
    modelle: {
      bereiche,
      warteschlange,
      statistik,
      fehler: fehlerListe,
      pruefungen,
      aufgaben: sichtbareAufgaben,
      termine: sichtbareTermine,
      zuletzt: sichtbareZuletzt,
      projekte: sichtbareProjekte,
      pdfs: sichtbarePdfs,
      aktivitaet
    }
  };
})();

(window as any).Lernwelt = Lernwelt;
