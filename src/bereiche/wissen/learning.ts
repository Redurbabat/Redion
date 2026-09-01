/* ============================================================================
 * bereiche/wissen/learning.ts — Lernen aus normalen Redion-Inhalten
 * ----------------------------------------------------------------------------
 * Lernkarten, Notizen und Aufgaben bleiben gewöhnliche Blöcke. Dieses Modul
 * ergänzt nur einen kleinen, versionsfesten Quellverweis und baut daraus die
 * Tageswarteschlange, Fehlertraining und Statistik. Es gibt weder einen
 * zweiten Speicher noch eine heimliche Umstellung des Lernverfahrens:
 * `WissenDienst.planen` bleibt SM-2.
 * ==========================================================================*/

const Learning = (() => {
  type SourceRegion = { x: number; y: number; width: number; height: number };
  type SourceRef = {
    version: 1;
    kind: 'pdfseite' | 'blatt' | 'block';
    pageId: string;
    blockId: string;
    pageNumber?: number;
    label: string;
    region?: SourceRegion;
    createdAt: string;
  };

  type ExamCountdown = {
    collectionId: string;
    rowId: string;
    title: string;
    date: string;
    days: number;
  };

  type TopicProgress = {
    id: string;
    label: string;
    total: number;
    learned: number;
    stable: number;
    due: number;
    errors: number;
    /**
     * ABDECKUNG, nicht Können: wie weit man durch den Stoff ist. Die Regel
     * steht im Kommentar über `topicProgress`. EINE zweimal beantwortete
     * Karte ergibt 100 %, und das ist als Abdeckung richtig.
     */
    progress: number;
    /* --- E289: eine Zahl ANDERER ART, nicht eine zweite Fortschrittszahl ---
       `progress` sagt, wie weit man gekommen ist. Die drei hier sagen, wie
       verlässlich das Können ist und WORAUS das geschlossen wird. Sie kommen
       aus `core/learning/kompetenz.ts`; fehlt das Modul (alte Einzeldatei),
       bleiben sie leer und die Anzeige lässt sie weg. */
    belege: number;
    sicherheit: number;
    stufe: string;
    kompetenzSatz: string;
  };

  type Queue = {
    errors: any[];
    due: any[];
    newCards: any[];
    all: any[];
    future: any[];
    nextAt: string;
    exam: ExamCountdown | null;
  };

  type LearningStatistics = {
    total: number;
    learned: number;
    due: number;
    newCards: number;
    mistakes: number;
    reviewedToday: number;
    reviews: number;
    againReviews: number;
    againRate: number;
    againRateToday: number;
    /**
     * Richtig durch bewertet, über die GESAMTE Zeit und ohne die Zahl der
     * Antworten daneben. Bleibt, weil andere Stellen sie lesen; für eine
     * Aussage über das Können ist `sicherheit` die ehrlichere Zahl (E289).
     */
    successRate: number;
    /** Wie viele Antworten die Aussage trägt (E289). */
    belege: number;
    /** Die untere Schranke des Wilson-Intervalls, in Prozent (E289). */
    sicherheit: number;
    /** Ein Satz im Klartext, oder leer bei zu wenig Belegen (E289). */
    kompetenzSatz: string;
    nextAt: string;
    topics: TopicProgress[];
  };

  const elementFrom = (event: Event): Element | null =>
    event.target instanceof Element ? event.target : null;

  /* Ohne Kontenmodul gehört der lokale Bestand weiterhin dem Gerät. Sobald
     Konten geladen ist, entscheidet ausschliesslich dessen bestehende
     `darf`-Semantik — hier entsteht keine zweite Rollenlogik. */
  const rightsActive = (): boolean =>
    typeof Konten !== 'undefined' && typeof Konten.darf === 'function';

  const permitted = (action: 'lesen' | 'bearbeiten', pageId?: string): boolean =>
    !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));

  const ownerPageId = (block: any): string => {
    if (!block?.id || typeof Links === 'undefined' || !Links.seiteVon) return '';
    return String(Links.seiteVon(block.id)?.id || '');
  };

  /** Die echte Datenbankseite; verknüpfte Ansichten erteilen keine Rechte. */
  const collectionPageId = (collectionId: string): string => {
    const views = Object.values<any>(Store.cache.blocks)
      .filter(block => block?.alive !== false && block.type === 'database' &&
        block.collectionId === collectionId);
    const view = views.find(block => !block.verknuepft) || views[0];
    return view ? ownerPageId(view) : '';
  };

  const canReadCollection = (collectionId: string): boolean => {
    if (!rightsActive()) return true;
    const pageId = collectionPageId(collectionId);
    return !!pageId && permitted('lesen', pageId);
  };

  const sourcePageId = (card: any): string => {
    const ref = card?.sourceRef || card?.lernquelle;
    return String(ref?.pageId || ownerPageId(card));
  };

  const canReadCard = (card: any): boolean => {
    if (!rightsActive()) return true;
    const pageId = sourcePageId(card);
    const ownerId = ownerPageId(card);
    return !!pageId && !!ownerId && !!Store.getBlock(pageId) && !!Store.getBlock(ownerId) &&
      permitted('lesen', pageId) && permitted('lesen', ownerId);
  };

  /** Bewertet wird der Kartenblock, deshalb zählt die Seite, die ihn trägt. */
  const canEditCard = (card: any): boolean => {
    if (!rightsActive()) return true;
    const pageId = ownerPageId(card);
    return !!pageId && permitted('bearbeiten', pageId);
  };

  const cards = (): any[] => Object.values<any>(Store.cache.blocks)
    .filter(block => block?.alive !== false && block?.type === 'flashcard' && canReadCard(block));

  const validDate = (value: unknown): number => {
    const time = Date.parse(String(value || ''));
    return Number.isFinite(time) ? time : 0;
  };

  const reviewLog = (card: any): any[] => {
    const raw = card?.reviewVerlauf;
    const entries = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
    return entries.filter((entry: any) => entry && typeof entry === 'object')
      .sort((left: any, right: any) => String(left.at || '').localeCompare(String(right.at || '')) ||
        String(left.id || '').localeCompare(String(right.id || '')));
  };

  const lastReview = (card: any): any | null => {
    const log = reviewLog(card);
    return log.length ? log[log.length - 1] : null;
  };

  const ratingOf = (entry: any): number | null => {
    const rating = Number(entry?.rating);
    return Number.isInteger(rating) && rating >= 1 && rating <= 4 ? rating : null;
  };

  const isMistake = (card: any): boolean => {
    const review = lastReview(card);
    const rating = ratingOf(review);
    return review?.correct === false || (rating !== null && rating < 3);
  };

  const localDay = (value: unknown): string => {
    const date = value ? new Date(value as any) : new Date();
    if (!Number.isFinite(date.getTime())) return '';
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')].join('-');
  };

  /** Datumsspalten sind Kalendertage. Diese Auswertung bleibt auch an einem
      Wechsel zwischen Sommer- und Winterzeit bei exakt einem Tag pro Datum. */
  const calendarDayNumber = (date: Date): number =>
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

  const dateFrom = (value: unknown): Date | null => {
    if (value instanceof Date) {
      const copy = new Date(value.getTime());
      return Number.isFinite(copy.getTime()) ? copy : null;
    }
    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isFinite(date.getTime()) ? date : null;
    }
    const nested = value && typeof value === 'object'
      ? (value as any).start ?? (value as any).date ?? (value as any).from
      : value;
    const text = String(nested || '').trim();
    const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (plain) {
      const year = Number(plain[1]), month = Number(plain[2]) - 1, day = Number(plain[3]);
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) return date;
      return null;
    }
    const date = new Date(text);
    return Number.isFinite(date.getTime()) ? date : null;
  };

  const topicLabel = (card: any): string => {
    const explicit = card?.quiz?.topic ?? card?.lernThema ?? card?.topic;
    if (String(explicit || '').trim()) return String(explicit).trim().slice(0, 120);
    const ref = card?.sourceRef || card?.lernquelle;
    const sourcePage = ref?.pageId ? Store.getBlock(String(ref.pageId)) : null;
    const sourceTitle = String(sourcePage?.text || ref?.label || '').trim();
    if (sourceTitle) return sourceTitle.slice(0, 120);
    const owner = Store.getBlock(ownerPageId(card));
    return String(owner?.text || 'Ohne Thema').trim().slice(0, 120) || 'Ohne Thema';
  };

  /**
   * Fortschritt benutzt ausschliesslich den vorhandenen SM-2-Stand:
   * noch keine erfolgreiche Wiederholung = 0 %, eine = 50 %, zwei oder mehr
   * konsekutive Wiederholungen = 100 %. Ein Fehler setzt `wdh` wie bisher
   * zurück und wird dadurch sofort sichtbar, ohne eine zweite Fortschrittszahl.
   */
  /**
   * Die Kompetenz je Thema, aus `core/learning/kompetenz.ts`.
   *
   * Der Schlüssel ist derselbe wie in `topicProgress` — `topicLabel(card)`
   * kleingeschrieben —, damit sich beide ohne zweite Zuordnung treffen.
   * Fehlt das Modul, kommt eine leere Karte zurück und die Anzeige lässt
   * die Zahl weg, statt eine zu erfinden.
   */
  const kompetenzJeThema = (allCards: any[], now: number): Map<string, any> => {
    const K = (window as any).Kompetenz;
    if (!K || typeof K.jeThema !== 'function') return new Map();
    const liste = allCards.map((card: any) => ({
      id: String(card?.id || ''),
      thema: topicLabel(card),
      titel: String(card?.text || '').slice(0, 60),
      sr: card?.sr,
      reviewVerlauf: card?.reviewVerlauf
    })).filter(c => c.id);
    const out = new Map<string, any>();
    for (const e of K.jeThema(liste, { jetzt: now }))
      out.set(String(e.thema).toLocaleLowerCase('de-CH'), e);
    return out;
  };

  const topicProgress = (allCards = cards(), now = Date.now()): TopicProgress[] => {
    const kompetenz = kompetenzJeThema(allCards, now);
    const groups = new Map<string, TopicProgress & { points: number }>();
    allCards.forEach(card => {
      const label = topicLabel(card);
      const id = label.toLocaleLowerCase('de-CH');
      /* Die vier E289-Felder stehen hier mit, weil der Sammelbehälter denselben
         Typ trägt wie das Ergebnis. Gefüllt werden sie erst unten aus der
         Kompetenzrechnung — hier sind es nur Platzhalter. */
      const group = groups.get(id) || {
        id, label, total: 0, learned: 0, stable: 0, due: 0, errors: 0, progress: 0,
        belege: 0, sicherheit: 0, stufe: '', kompetenzSatz: '', points: 0
      };
      const repetitions = Math.max(0, Math.floor(Number(card?.sr?.wdh) || 0));
      group.total++;
      if (card?.sr || reviewLog(card).length) group.learned++;
      if (repetitions >= 2) group.stable++;
      if (card?.sr && (!card.sr.faellig || validDate(card.sr.faellig) <= now)) group.due++;
      if (isMistake(card)) group.errors++;
      group.points += Math.min(2, repetitions);
      groups.set(id, group);
    });
    return [...groups.values()].map(group => {
      const k = kompetenz.get(group.id);
      return {
        id: group.id,
        label: group.label,
        total: group.total,
        learned: group.learned,
        stable: group.stable,
        due: group.due,
        errors: group.errors,
        progress: group.total ? Math.round(group.points / (group.total * 2) * 100) : 0,
        belege: k ? k.belege : 0,
        /* Nur wenn genug Belege da sind. Sonst 0 UND leere Stufe — eine
           Zahl ohne Grundlage ist schlimmer als keine. */
        sicherheit: k && k.genug ? Math.round(k.sicherheit * 100) : 0,
        stufe: k ? k.stufe : '',
        kompetenzSatz: k ? k.satz : ''
      };
    }).sort((left, right) => right.errors - left.errors || right.due - left.due ||
      left.label.localeCompare(right.label, 'de-CH'));
  };

  const nextExam = (nowValue: unknown = new Date()): ExamCountdown | null => {
    const now = dateFrom(nowValue) || new Date();
    const today = calendarDayNumber(now);
    const upcoming: ExamCountdown[] = [];
    Object.values<any>(Store.cache.collections)
      .filter(collection => collection?.schoolKind === 'exams' && canReadCollection(collection.id))
      .forEach(collection => {
        const schema = collection.schema || {};
        const keys = Object.keys(schema);
        const dateKey = keys.find(key => schema[key]?.type === 'date');
        const titleKey = keys.find(key => schema[key]?.type === 'title');
        const statusKey = keys.find(key => schema[key]?.type === 'status');
        if (!dateKey) return;
        Store.rowsOf(collection.id).forEach((row: any) => {
          if (!row || row.alive === false) return;
          const status = String(statusKey ? row.props?.[statusKey] || '' : '').trim();
          if (/^(geschrieben|abgeschlossen|abgesagt|erledigt)$/i.test(status)) return;
          const date = dateFrom(row.props?.[dateKey]);
          if (!date) return;
          const days = calendarDayNumber(date) - today;
          if (days < 0) return;
          upcoming.push({
            collectionId: String(collection.id),
            rowId: String(row.id),
            title: String(row.text || (titleKey ? row.props?.[titleKey] : '') || 'Prüfung').trim(),
            date: localDay(date),
            days
          });
        });
      });
    upcoming.sort((left, right) => left.days - right.days ||
      left.title.localeCompare(right.title, 'de-CH') || left.rowId.localeCompare(right.rowId));
    return upcoming[0] || null;
  };

  /**
   * Die Tageswarteschlange ist nur eine Sicht auf vorhandene Karten.
   * Neue Karten werden pro Öffnen auf zwanzig begrenzt, fällige nie.
   */
  const dailyQueue = (newLimit = 20, nowValue: unknown = new Date()): Queue => {
    const nowDate = dateFrom(nowValue) || new Date();
    const now = nowDate.getTime();
    const allCards = cards();
    const fresh = allCards.filter(card => !card.sr).slice(0, Math.max(0, newLimit));
    const scheduledDue = allCards.filter(card => card.sr &&
      (!card.sr.faellig || validDate(card.sr.faellig) <= now));
    const errors = scheduledDue.filter(isMistake);
    const errorIds = new Set(errors.map(card => card.id));
    const due = scheduledDue.filter(card => !errorIds.has(card.id));
    const future = allCards.filter(card => card.sr?.faellig && validDate(card.sr.faellig) > now)
      .sort((left, right) => validDate(left.sr.faellig) - validDate(right.sr.faellig));
    return {
      errors,
      due,
      newCards: fresh,
      all: [...errors, ...due, ...fresh],
      future,
      nextAt: future[0]?.sr?.faellig || '',
      exam: nextExam(nowDate)
    };
  };

  const due = (): any[] => dailyQueue(Number.MAX_SAFE_INTEGER).all;

  const statistics = (queue = dailyQueue()): LearningStatistics => {
    const allCards = cards();
    /* E289: dieselbe Rechnung wie je Thema, nur über alles. */
    const K = (window as any).Kompetenz;
    const gesamtKompetenz = K && typeof K.gesamt === 'function'
      ? K.gesamt(allCards.map((card: any) => ({
          id: String(card?.id || ''), thema: 'alles',
          sr: card?.sr, reviewVerlauf: card?.reviewVerlauf
        })).filter((c: any) => c.id))
      : null;
    const logs = allCards.flatMap(reviewLog);
    const today = localDay(null);
    const todayLogs = logs.filter(entry => localDay(entry.at) === today);
    const rated = logs.filter(entry => ratingOf(entry) !== null);
    const todayRated = todayLogs.filter(entry => ratingOf(entry) !== null);
    const successful = rated.filter(entry => Number(entry.rating) >= 3).length;
    const againReviews = rated.filter(entry => ratingOf(entry) === 1).length;
    const todayAgain = todayRated.filter(entry => ratingOf(entry) === 1).length;
    return {
      total: allCards.length,
      learned: allCards.filter(card => !!card.sr).length,
      due: queue.errors.length + queue.due.length,
      newCards: allCards.filter(card => !card.sr).length,
      mistakes: allCards.filter(isMistake).length,
      reviewedToday: todayLogs.length,
      reviews: logs.length,
      againReviews,
      againRate: rated.length ? Math.round(againReviews / rated.length * 100) : 0,
      againRateToday: todayRated.length ? Math.round(todayAgain / todayRated.length * 100) : 0,
      successRate: rated.length ? Math.round(successful / rated.length * 100) : 0,
      belege: gesamtKompetenz ? gesamtKompetenz.belege : rated.length,
      sicherheit: gesamtKompetenz && gesamtKompetenz.genug
        ? Math.round(gesamtKompetenz.sicherheit * 100) : 0,
      kompetenzSatz: gesamtKompetenz ? gesamtKompetenz.satz : '',
      nextAt: queue.nextAt,
      topics: topicProgress(allCards)
    };
  };

  const clozeParts = (text: string): [string, string] | null => {
    const answers: string[] = [];
    const front = text.replace(/\{\{([^{}\n]+)\}\}/g, (_whole, raw: string) => {
      const pieces = String(raw).split('::');
      const answer = (pieces.shift() || '').trim();
      const hint = pieces.join('::').trim();
      if (answer) answers.push(answer);
      return hint ? '[' + hint + ']' : '[…]';
    });
    if (!answers.length) return null;
    return [front, answers.join(' · ')];
  };

  /** Standardkarten benutzen `Frage :: Antwort`, Lückenkarten `{{Antwort}}`. */
  const splitCard = (card: any): [string, string] => {
    const text = String(card?.text || '');
    const cloze = clozeParts(text);
    if (cloze) return cloze;
    const separator = text.indexOf('::');
    return separator >= 0
      ? [text.slice(0, separator).trim(), text.slice(separator + 2).trim()]
      : [text, '(noch keine Antwort — mit :: trennen oder {{Lücke}} setzen)'];
  };

  const sourceOf = (value: any): SourceRef | null => {
    const raw = value?.sourceRef || value?.lernquelle || value;
    if (!raw || Number(raw.version) !== 1 || !raw.pageId || !raw.blockId) return null;
    return raw as SourceRef;
  };

  const sourceLabel = (source: SourceRef | null): string => {
    if (!source) return '';
    const page = Store.getBlock(source.pageId);
    if ((rightsActive() && !page) || !permitted('lesen', source.pageId))
      return 'Nicht freigegebene Quelle';
    const pageTitle = String(page?.text || source.label || 'Ohne Titel');
    return source.pageNumber
      ? pageTitle + ' · Seite ' + Number(source.pageNumber)
      : pageTitle;
  };

  const makeSourceRef = (
    page: any,
    sourceBlock: any,
    region?: SourceRegion | null
  ): SourceRef => {
    const kind = sourceBlock?.type === 'pdfseite'
      ? 'pdfseite' : sourceBlock?.type === 'blatt' ? 'blatt' : 'block';
    const label = String(page?.text || 'Ohne Titel');
    const ref: SourceRef = {
      version: 1,
      kind,
      pageId: String(page?.id || ''),
      blockId: String(sourceBlock?.id || ''),
      label,
      createdAt: Store.now()
    };
    if (kind === 'pdfseite' && Number(sourceBlock?.nr)) ref.pageNumber = Number(sourceBlock.nr);
    if (region && [region.x, region.y, region.width, region.height].every(Number.isFinite)) {
      ref.region = {
        x: Number(region.x), y: Number(region.y),
        width: Math.max(0, Number(region.width)), height: Math.max(0, Number(region.height))
      };
    }
    return ref;
  };

  /** Öffnet immer den echten Quellblock; ein Seitentitel reicht dafür nicht. */
  const jumpToSource = (value: any): boolean => {
    const source = sourceOf(value);
    if (!source) { UI.toast('Für diesen Inhalt ist keine Quelle gespeichert.'); return false; }
    if (!permitted('lesen', source.pageId)) {
      UI.toast('Du darfst diese Quellseite nicht lesen.');
      return false;
    }
    if (Store.getBlock(source.blockId) && App.zeigeBlock?.(source.blockId)) return true;
    if (Store.getBlock(source.pageId)) {
      App.oeffne(source.pageId);
      UI.toast('Die Quellseite ist offen; der ursprüngliche Block fehlt.');
      return true;
    }
    UI.toast('Die gespeicherte Quelle ist nicht mehr vorhanden.');
    return false;
  };

  const button = (text: string, action: string, primary = false): HTMLButtonElement => {
    const item = document.createElement('button');
    item.type = 'button';
    item.dataset.learningAction = action;
    item.textContent = text;
    item.style.minHeight = '44px';
    if (primary) item.classList.add('prim');
    return item;
  };

  const overlay = (titleText: string): {
    root: HTMLDivElement;
    panel: HTMLDivElement;
    body: HTMLDivElement;
    close: () => void;
  } => {
    const root = document.createElement('div');
    root.className = 'overlay';
    const panel = document.createElement('div');
    panel.className = 'finder lern';
    panel.style.width = 'min(680px, 94vw)';
    panel.style.maxHeight = 'min(780px, 92vh)';
    panel.style.overflow = 'auto';
    const header = document.createElement('div');
    header.className = 'fh';
    const title = document.createElement('strong');
    title.textContent = titleText;
    const closeButton = button('✕', 'close');
    closeButton.classList.add('icon-btn');
    closeButton.setAttribute('aria-label', 'Schliessen');
    header.append(title, closeButton);
    const body = document.createElement('div');
    body.style.padding = '18px';
    panel.append(header, body);
    root.appendChild(panel);
    document.body.appendChild(root);
    const close = (): void => {
      root.dispatchEvent(new Event('learning-close'));
      root.remove();
    };
    root.addEventListener('click', event => {
      if (event.target === root || elementFrom(event)?.closest('[data-learning-action="close"]')) close();
    });
    return { root, panel, body, close };
  };

  const field = (
    labelText: string,
    multiline = false,
    placeholder = ''
  ): { wrap: HTMLLabelElement; input: HTMLInputElement | HTMLTextAreaElement } => {
    const wrap = document.createElement('label');
    wrap.style.display = 'grid';
    wrap.style.gap = '6px';
    wrap.style.marginBottom = '14px';
    const label = document.createElement('span');
    label.textContent = labelText;
    label.style.fontWeight = '650';
    const input = multiline ? document.createElement('textarea') : document.createElement('input');
    input.placeholder = placeholder;
    input.style.minHeight = multiline ? '110px' : '44px';
    if (multiline) (input as HTMLTextAreaElement).rows = 4;
    wrap.append(label, input);
    return { wrap, input };
  };

  const addWithSource = (
    page: any,
    sourceBlock: any,
    region: SourceRegion | null | undefined,
    type: string,
    fields: Record<string, unknown>
  ): any => {
    if (!permitted('bearbeiten', page?.id)) {
      UI.toast('Du darfst auf dieser Seite nichts anlegen.');
      return null;
    }
    const sourceRef = makeSourceRef(page, sourceBlock, region);
    /* `sourceRef` ist der kanonische Name. `lernquelle` hält denselben kleinen
       Vertrag für ältere/äussere Leser sichtbar; beides liegt am normalen
       Block und reist automatisch durch Sicherung und Synchronisation. */
    return Store.addBlock(page.id, type, { ...fields, sourceRef, lernquelle: sourceRef });
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Das Seitenbild liess sich nicht öffnen.'));
    image.src = url;
  });

  const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Der Ausschnitt blieb leer.')),
      'image/webp', 0.9);
  });

  /** Legt nur den gewählten Ausschnitt ab, niemals eine zweite volle PDF. */
  const createCrop = async (
    page: any,
    sourceBlock: any,
    region: SourceRegion | null | undefined
  ): Promise<any | null> => {
    if (!permitted('bearbeiten', page?.id)) {
      UI.toast('Du darfst auf dieser Seite keinen Ausschnitt anlegen.');
      return null;
    }
    if (sourceBlock?.type !== 'pdfseite' || !sourceBlock.bildDateiId || !region) {
      UI.toast('Für ein Bild zuerst auf einer PDF-Seite einen Ausschnitt markieren.');
      return null;
    }
    if (typeof Dateien === 'undefined') {
      UI.toast('Die Dateiablage ist noch nicht bereit.');
      return null;
    }
    let created: any = null;
    let stored: any = null;
    try {
      const url = await Dateien.adresse(sourceBlock.bildDateiId);
      if (!url) throw new Error('Das Seitenbild fehlt.');
      const image = await loadImage(url);
      const pageWidth = Number(sourceBlock.bw) || 595.28;
      const pageHeight = Number(sourceBlock.bh) || 841.89;
      const sx = Math.max(0, region.x / pageWidth * image.naturalWidth);
      const sy = Math.max(0, region.y / pageHeight * image.naturalHeight);
      const sw = Math.min(image.naturalWidth - sx, region.width / pageWidth * image.naturalWidth);
      const sh = Math.min(image.naturalHeight - sy, region.height / pageHeight * image.naturalHeight);
      if (sw < 2 || sh < 2) throw new Error('Der gewählte Ausschnitt ist zu klein.');
      const scale = Math.min(1, 1600 / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Der Browser kann den Ausschnitt nicht zeichnen.');
      context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas);
      const caption = 'Ausschnitt · Seite ' + (Number(sourceBlock.nr) || 1);
      created = addWithSource(page, sourceBlock, region, 'image', { caption, typ: 'image/webp' });
      if (!created) return null;
      const file = new File([blob], 'ausschnitt-seite-' + (Number(sourceBlock.nr) || 1) + '.webp',
        { type: 'image/webp' });
      /* Der kleine Ausschnitt ist Lerninhalt und nicht bloss ein jederzeit
         rekonstruierbarer Cache: er reist deshalb durch Backup und Sync. */
      stored = await Dateien.ablegen(file, { blockId: created.id });
      Store.updateBlock(created.id, { dateiId: stored.id });
      App.zeichneSeite();
      UI.toast('Bild-Ausschnitt angelegt.');
      return Store.getBlock(created.id) || created;
    } catch (error: unknown) {
      if (stored?.id && Dateien.weg) void Dateien.weg(stored.id);
      if (created?.id) Store.trashBlock(created.id);
      UI.toast(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const formForAction = (
    body: HTMLElement,
    kind: 'note' | 'card' | 'task',
    page: any,
    sourceBlock: any,
    region: SourceRegion | null | undefined,
    close: () => void
  ): void => {
    body.replaceChildren();
    const source = document.createElement('p');
    source.textContent = 'Quelle: ' + sourceLabel(makeSourceRef(page, sourceBlock, region));
    source.style.color = 'var(--text-dim)';
    const fields: Array<{ wrap: HTMLLabelElement; input: HTMLInputElement | HTMLTextAreaElement }> = [];
    if (kind === 'card') {
      fields.push(field('Frage', true, 'Was soll abgefragt werden?'));
      fields.push(field('Antwort', true, 'Die kurze, eindeutige Antwort'));
    } else {
      fields.push(field(kind === 'task' ? 'Aufgabe' : 'Notiz', true,
        kind === 'task' ? 'Was ist zu erledigen?' : 'Gedanke zu dieser Stelle'));
    }
    const actions = document.createElement('div');
    actions.className = 'fbtns';
    actions.append(button('Abbrechen', 'close'), button('Anlegen', 'save', true));
    body.append(source, ...fields.map(item => item.wrap), actions);
    fields[0]?.input.focus();
    actions.addEventListener('click', event => {
      if (!elementFrom(event)?.closest('[data-learning-action="save"]')) return;
      const values = fields.map(item => item.input.value.trim());
      if (!values[0]) { UI.toast('Bitte zuerst einen Text eingeben.'); return; }
      let created: any;
      if (kind === 'card') {
        created = addWithSource(page, sourceBlock, region, 'flashcard',
          { text: values[0] + ' :: ' + (values[1] || '') });
      } else if (kind === 'task') {
        created = addWithSource(page, sourceBlock, region, 'todo',
          { text: values[0], checked: false });
      } else {
        created = addWithSource(page, sourceBlock, region, 'text', { text: values[0] });
      }
      if (!created) return;
      close();
      App.zeichneSeite(created?.id, 'ende');
      UI.toast(kind === 'card' ? 'Karteikarte angelegt.' :
        kind === 'task' ? 'Aufgabe angelegt.' : 'Notiz angelegt.');
    });
  };

  /** Kontextaktionen des Dokumentmodus: alles entsteht als gewöhnlicher Block. */
  const sourceMenu = (
    page: any,
    sourceBlock: any,
    region?: SourceRegion | null
  ): void => {
    if (!page?.id || !sourceBlock?.id) { UI.toast('Die Quelle ist nicht vollständig.'); return; }
    if (!permitted('lesen', page.id)) { UI.toast('Du darfst diese Quellseite nicht lesen.'); return; }
    if (!permitted('bearbeiten', page.id)) {
      UI.toast('Du darfst auf dieser Seite keine Lerninhalte anlegen.');
      return;
    }
    const view = overlay('Aus Quelle anlegen');
    const source = document.createElement('p');
    source.textContent = sourceLabel(makeSourceRef(page, sourceBlock, region));
    source.style.color = 'var(--text-dim)';
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
    grid.style.gap = '10px';
    grid.append(
      button('¶ Als Notiz', 'note'),
      button('🎴 Als Karte', 'card'),
      button('☑ Als Aufgabe', 'task'),
      button('▧ Als Bild', 'image'),
      button('🔗 Als Link', 'link')
    );
    const imageButton = grid.querySelector<HTMLButtonElement>('[data-learning-action="image"]');
    if (imageButton && (sourceBlock.type !== 'pdfseite' || !region)) {
      imageButton.disabled = true;
      imageButton.title = 'Dafür zuerst einen PDF-Ausschnitt markieren';
    }
    const hint = document.createElement('p');
    hint.textContent = region
      ? 'Der genaue Ausschnitt bleibt am neuen Block als Quelle gespeichert.'
      : 'Die genaue Dokumentseite bleibt am neuen Block als Quelle gespeichert.';
    hint.style.color = 'var(--text-dim)';
    hint.style.fontSize = '13px';
    view.body.append(source, grid, hint);
    grid.addEventListener('click', event => {
      const action = elementFrom(event)?.closest<HTMLElement>('[data-learning-action]')
        ?.dataset.learningAction;
      if (action === 'note' || action === 'card' || action === 'task') {
        formForAction(view.body, action, page, sourceBlock, region, view.close);
        return;
      }
      if (action === 'link') {
        const created = addWithSource(page, sourceBlock, region, 'text',
          { text: '((' + sourceBlock.id + '))' });
        if (!created) return;
        view.close();
        App.zeichneSeite(created?.id, 'ende');
        UI.toast('Verweis auf die Quelle angelegt.');
        return;
      }
      if (action === 'image') {
        view.close();
        void createCrop(page, sourceBlock, region);
      }
    });
  };

  /** Aus markiertem Text entsteht eine Lückenkarte mit exaktem Blockverweis. */
  const clozeFromSelection = (block: any, selectedText: string, selectedOffset = -1): any | null => {
    const selected = String(selectedText || '').trim();
    const original = String(block?.text || '');
    if (!block?.id || !selected || !original.includes(selected)) {
      UI.toast('Die markierte Stelle liess sich nicht als Lücke übernehmen.');
      return null;
    }
    const replaceSelection = (): string =>
      selectedOffset >= 0 && original.slice(selectedOffset, selectedOffset + selected.length) === selected
        ? original.slice(0, selectedOffset) + '{{' + selected + '}}' + original.slice(selectedOffset + selected.length)
        : original.replace(selected, '{{' + selected + '}}');
    if (block.type === 'flashcard') {
      if (!canEditCard(block)) {
        UI.toast('Diese Karte ist nur lesbar und kann nicht geändert werden.');
        return null;
      }
      Store.updateBlock(block.id, { text: replaceSelection() });
      App.zeichneSeite(block.id, 'ende');
      UI.toast('Lücke in der Karte angelegt.');
      return Store.getBlock(block.id);
    }
    const page = Links.seiteVon(block.id);
    if (!page) { UI.toast('Zu diesem Text fehlt die Seite.'); return null; }
    if (!permitted('bearbeiten', page.id)) {
      UI.toast('Du darfst auf dieser Seite keine Lückenkarte anlegen.');
      return null;
    }
    const text = replaceSelection();
    const created = addWithSource(page, block, null, 'flashcard', { text });
    if (!created) return null;
    App.zeichneSeite();
    UI.toast('Lückenkarte angelegt.');
    return created;
  };

  const statCard = (number: string, labelText: string): HTMLDivElement => {
    const card = document.createElement('div');
    card.style.padding = '14px';
    card.style.border = '1px solid var(--line)';
    card.style.borderRadius = '10px';
    const value = document.createElement('b');
    value.textContent = number;
    value.style.display = 'block';
    value.style.fontSize = '24px';
    const label = document.createElement('span');
    label.textContent = labelText;
    label.style.color = 'var(--text-dim)';
    label.style.fontSize = '13px';
    card.append(value, label);
    return card;
  };

  const examWhen = (exam: ExamCountdown | null): string => {
    if (!exam) return '–';
    if (exam.days === 0) return 'heute';
    if (exam.days === 1) return 'morgen';
    return 'in ' + exam.days + ' Tagen';
  };

  /**
   * ZUERST AUFFRISCHEN (L106 Punkt 2, E325).
   *
   * Die Haltbarkeit wird seit E289 gerechnet und in jedem Themensatz
   * genannt — „davon dürfte heute noch 62 % sitzen". Damit liess sich
   * nichts anfangen: keine Reihenfolge, keine Liste, kein Weg von der Zahl
   * zur Handlung. L106 sagt es selbst: „Genau das wäre der Nutzen."
   *
   * ER STEHT NUR DA, WENN ES ETWAS ZU TUN GIBT. Wer nichts vergessen hat,
   * bekommt keine leere Überschrift „Zuerst auffrischen" — eine Liste, die
   * immer da ist, wird nicht gelesen, und beim Lernen ist sie zusätzlich
   * eine Ermahnung ohne Anlass.
   */
  const auffrischSection = (allCards = cards(), now = Date.now()): HTMLElement | null => {
    const K = (window as any).Kompetenz;
    if (!K || typeof K.auffrischen !== 'function') return null;
    const themen = [...kompetenzJeThema(allCards, now).values()];
    const liste = K.auffrischen(themen, { hoechstens: 4 });
    if (!liste.length) return null;

    const section = document.createElement('section');
    section.style.marginTop = '20px';
    const title = document.createElement('h3');
    title.textContent = 'Zuerst auffrischen';
    title.style.marginBottom = '4px';
    const unter = document.createElement('p');
    unter.style.cssText = 'margin:0 0 10px; font-size:12.5px; color:var(--text-faint)';
    /* Die Reihenfolge sagt, wonach sie geordnet ist. Eine sortierte Liste
       ohne genanntes Mass ist eine Behauptung (§38 sinngemäss: nicht nur
       über die Stelle in der Liste). */
    unter.textContent = 'Nach dem, was rechnerisch am meisten verblasst ist. ' +
      'Fälliges zählt doppelt, weil es sich sofort zurückholen lässt — und ' +
      'nur Themen, bei denen mindestens eine ganze Karte verblasst ist.';
    section.append(title, unter);

    const list = document.createElement('div');
    list.style.cssText = 'display:grid; gap:8px';
    liste.forEach((e: any) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:9px 11px; border:1px solid var(--line); ' +
        'border-radius:9px; display:flex; justify-content:space-between; ' +
        'gap:12px; align-items:baseline';
      const links = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = e.thema;
      const satz = document.createElement('small');
      satz.style.cssText = 'display:block; margin-top:2px; color:var(--text-dim)';
      satz.textContent = e.satz;
      links.append(name, satz);
      /* Die Zahl rechts ist der Anteil, der noch sitzt — nicht nur Farbe
         oder Reihenfolge (§38). */
      const rechts = document.createElement('span');
      rechts.style.cssText = 'white-space:nowrap; font-variant-numeric:tabular-nums; ' +
        'color:var(--text-faint); font-size:13px';
      rechts.textContent = Math.round(e.haltbarkeit * 100) + ' %';
      rechts.title = 'Anteil des Themas, der heute rechnerisch noch sitzt';
      row.append(links, rechts);
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  };

  /**
   * GEHT ES AUFWÄRTS? (L106 Punkt 3 und 4, E328)
   *
   * Der Themenfortschritt sagt, wo man STEHT. Er sagt nicht, wohin es
   * geht — und das ist die Frage, die man sich nach drei Monaten Lernen
   * wirklich stellt.
   *
   * WANN DIESER ABSCHNITT SCHWEIGT, und das ist der wichtigere Teil:
   * `Kompetenz.verlauf` gibt nur Themen zurück, die in BEIDEN Zeiträumen
   * genug Belege haben. Wer erst seit vier Wochen lernt, bekommt hier
   * nichts — nicht „0 % Veränderung", sondern gar keinen Abschnitt. Eine
   * Überschrift „Geht es aufwärts?" über einer leeren Antwort ist eine
   * Frage, die sich selbst nicht beantworten kann.
   */
  const verlaufSection = (allCards = cards(), now = Date.now()): HTMLElement | null => {
    const K = (window as any).Kompetenz;
    if (!K || typeof K.verlauf !== 'function') return null;
    const liste = allCards.map((card: any) => ({
      id: String(card?.id || ''), thema: topicLabel(card),
      titel: String(card?.text || '').slice(0, 60),
      sr: card?.sr, reviewVerlauf: card?.reviewVerlauf
    })).filter((c: any) => c.id);
    const reihen = K.verlauf(liste, { jetzt: now });
    if (!reihen.length) return null;

    const section = document.createElement('section');
    section.style.marginTop = '20px';
    const title = document.createElement('h3');
    title.textContent = 'Geht es aufwärts?';
    title.style.marginBottom = '4px';
    const unter = document.createElement('p');
    unter.style.cssText = 'margin:0 0 10px; font-size:12.5px; color:var(--text-faint)';
    unter.textContent = 'Die letzten ' + (reihen[0].tage) + ' Tage gegen die ' +
      reihen[0].tage + ' davor. Nur Themen, die in BEIDEN Zeiträumen genug ' +
      'Antworten haben — sonst wäre es ein Vergleich mit nichts.';
    section.append(title, unter);

    const list = document.createElement('div');
    list.style.cssText = 'display:grid; gap:8px';
    reihen.forEach((e: any) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:9px 11px; border:1px solid var(--line); ' +
        'border-radius:9px; display:flex; justify-content:space-between; ' +
        'gap:12px; align-items:baseline';
      const links = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = e.thema;
      const satz = document.createElement('small');
      satz.style.cssText = 'display:block; margin-top:2px; color:var(--text-dim)';
      satz.textContent = e.satz;
      links.append(name, satz);

      /* §38: nicht nur Farbe. Das Zeichen sagt die Richtung, die Zahl sagt
         wieviel, und beide stehen auch ohne Farbe da. Vorzeichen inklusive
         — „5 Punkte" ohne Vorzeichen ist keine Richtung. */
      const rechts = document.createElement('span');
      const punkte = Math.round(e.unterschied * 100);
      const zeichen = e.richtung === 'auf' ? '▲' : e.richtung === 'ab' ? '▼' : '=';
      const farbe = e.richtung === 'auf' ? 'var(--c-green)'
                  : e.richtung === 'ab' ? 'var(--c-red)' : 'var(--text-faint)';
      rechts.style.cssText = 'white-space:nowrap; font-variant-numeric:tabular-nums; ' +
        'font-size:13px; color:' + farbe;
      rechts.textContent = e.richtung === 'gleich'
        ? '= gleich'
        : zeichen + ' ' + (punkte > 0 ? '+' : '') + punkte + ' Punkte';
      rechts.title = 'Unterschied der Sicherheit in Prozentpunkten';
      row.append(links, rechts);
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  };

  const topicSection = (topics: TopicProgress[]): HTMLElement => {
    const section = document.createElement('section');
    section.style.marginTop = '20px';
    const title = document.createElement('h3');
    title.textContent = 'Themenfortschritt';
    title.style.marginBottom = '10px';
    section.appendChild(title);
    if (!topics.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Noch keine Themen mit Lernkarten.';
      empty.style.color = 'var(--text-dim)';
      section.appendChild(empty);
      return section;
    }
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gap = '10px';
    topics.forEach(topic => {
      const row = document.createElement('div');
      row.style.padding = '11px 12px';
      row.style.border = '1px solid var(--line)';
      row.style.borderRadius = '9px';
      const heading = document.createElement('div');
      heading.style.display = 'flex';
      heading.style.justifyContent = 'space-between';
      heading.style.gap = '12px';
      const label = document.createElement('strong');
      label.textContent = topic.label;
      const percent = document.createElement('span');
      percent.textContent = topic.progress + ' %';
      percent.style.whiteSpace = 'nowrap';
      /* Die Zahl sagt nicht, was sie misst — der Titel schon (E289). */
      percent.title = 'Abdeckung: wie viele Karten mindestens zweimal sassen. ' +
        'Keine Aussage darüber, wie sicher der Stoff sitzt.';
      heading.append(label, percent);
      const progress = document.createElement('progress');
      progress.max = 100;
      progress.value = topic.progress;
      progress.setAttribute('aria-label', 'Fortschritt für ' + topic.label);
      progress.style.display = 'block';
      progress.style.width = '100%';
      progress.style.margin = '8px 0 5px';
      const detail = document.createElement('small');
      detail.style.color = 'var(--text-dim)';
      const parts = ['Abdeckung: ' + topic.learned + ' von ' + topic.total + ' begonnen',
        topic.stable + ' stabil'];
      if (topic.due) parts.push(topic.due + ' fällig');
      if (topic.errors) parts.push(topic.errors + ' Fehler');
      detail.textContent = parts.join(' · ');
      row.append(heading, progress, detail);
      /* E289: darunter die Aussage über das KÖNNEN, mit ihrer Grundlage.
         Sie steht nur da, wenn es sie gibt — ein leerer Satz wäre eine
         Zeile, die nichts sagt. */
      if (topic.kompetenzSatz) {
        const koennen = document.createElement('small');
        koennen.style.display = 'block';
        koennen.style.marginTop = '3px';
        koennen.style.color = topic.stufe ? 'var(--text)' : 'var(--text-faint)';
        koennen.textContent = topic.kompetenzSatz;
        row.appendChild(koennen);
      }
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  };

  const open = (): void => {
    const view = overlay('🎴 Lernen');
    let session: any[] = [];
    let index = 0;
    let answerOpen = false;
    let learned = 0;

    const renderDashboard = (): void => {
      const queue = dailyQueue();
      const stats = statistics(queue);
      view.body.replaceChildren();
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
      grid.style.gap = '10px';
      grid.append(
        statCard(String(queue.errors.length + queue.due.length), 'Karten fällig'),
        statCard(String(queue.newCards.length), 'neue Karten'),
        statCard(String(queue.errors.length), 'Fehler'),
        statCard(examWhen(queue.exam), queue.exam ? 'Prüfung · ' + queue.exam.title : 'Prüfung')
      );
      const exam = document.createElement('p');
      exam.style.color = 'var(--text-dim)';
      exam.style.fontSize = '13px';
      exam.textContent = queue.exam
        ? 'Prüfung ' + examWhen(queue.exam) + ': ' + queue.exam.title + ' · ' +
          new Date(queue.exam.date + 'T12:00:00').toLocaleDateString('de-CH')
        : 'Keine anstehende Prüfung in den Ausbildungsdaten gefunden.';
      const explanation = document.createElement('p');
      explanation.textContent = queue.all.length
        ? 'Deine Tagesrunde: zuerst fällige Fehler, dann fällige Karten und bis zu 20 neue.'
        : stats.total ? 'Für heute ist alles erledigt.' :
          'Noch keine Karten. Lege eine Karte an oder markiere Text und wähle „Lücke“.';
      explanation.style.lineHeight = '1.55';
      const actions = document.createElement('div');
      actions.style.display = 'grid';
      actions.style.gap = '9px';
      const start = button('Tagesrunde starten · ' + queue.all.length, 'start-today', true);
      start.disabled = !queue.all.length;
      const allMistakes = cards().filter(isMistake);
      const mistakes = button('Fehler trainieren · ' + allMistakes.length, 'start-errors');
      mistakes.disabled = !allMistakes.length;
      actions.append(start, mistakes);
      const details = document.createElement('div');
      details.style.display = 'grid';
      details.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
      details.style.gap = '10px';
      details.style.marginTop = '16px';
      details.append(
        statCard(String(stats.learned) + ' / ' + String(stats.total), 'Karten mit Lernstand'),
        statCard(String(stats.reviewedToday), 'heute gelernt'),
        statCard(String(stats.againRate) + ' %', 'Nochmal-Rate'),
        statCard(String(stats.reviews), 'Wiederholungen')
      );
      const next = document.createElement('p');
      next.style.color = 'var(--text-dim)';
      next.style.fontSize = '13px';
      next.textContent = stats.nextAt
        ? 'Nächster geplanter Termin: ' + new Date(String(stats.nextAt)).toLocaleString('de-DE')
        : 'Noch kein weiterer Termin geplant.';
      /* DER SATZ WIRD ZUR WAHL (E303). Hier stand: „SM-2 bleibt der Standard.
         Es findet keine automatische FSRS-Migration statt." Beides gilt
         weiter — nur gibt es das zweite Verfahren jetzt wirklich, und dann
         ist eine Auskunft ohne Griff eine Anzeige ohne Knopf (§47). */
      const algorithm = document.createElement('div');
      algorithm.className = 'lern-verfahren';
      const jetzt = String(Store.getMeta('lernVerfahren', 'sm2'));
      const titel = document.createElement('p');
      titel.style.fontSize = '13px';
      titel.style.margin = '0 0 6px';
      titel.textContent = 'Lernplan';
      const reihe = document.createElement('div');
      reihe.style.display = 'flex';
      reihe.style.gap = '6px';
      reihe.style.flexWrap = 'wrap';
      const satz = document.createElement('p');
      satz.style.color = 'var(--text-dim)';
      satz.style.fontSize = '12px';
      satz.style.margin = '8px 0 0';
      const satzSetzen = (art: string): void => {
        satz.textContent = art === 'fsrs'
          ? 'FSRS rechnet, wie wahrscheinlich du eine Karte noch kannst, und ' +
            'setzt den Termin dorthin, wo sie unter deine Zielrate fällt. ' +
            'Schon geplante Termine bleiben, wie sie sind — umgestellt wird ' +
            'jede Karte erst bei ihrer nächsten Antwort, und im Verlauf steht ' +
            'dann, dass ihr Startwert aus SM-2 geschätzt wurde.'
          : 'SM-2 ist das Verfahren von Anki: leichter beantwortet = längerer ' +
            'Abstand. Es bleibt die Vorgabe, und es findet keine automatische ' +
            'Umstellung statt.';
      };
      const WAHL: ReadonlyArray<readonly [string, string]> =
        [['sm2', 'SM-2 (Anki)'], ['fsrs', 'FSRS 4.5']];
      for (const [wert, name] of WAHL) {
        const k = document.createElement('button');
        k.type = 'button';
        k.className = 'lern-verfahren-knopf' + (jetzt === wert ? ' on' : '');
        k.textContent = name;
        k.setAttribute('aria-pressed', jetzt === wert ? 'true' : 'false');
        k.dataset.verfahren = wert;
        k.addEventListener('click', () => {
          Store.setMeta('lernVerfahren', wert);
          reihe.querySelectorAll<HTMLElement>('[data-verfahren]').forEach(x => {
            const an = x.dataset.verfahren === wert;
            x.classList.toggle('on', an);
            x.setAttribute('aria-pressed', an ? 'true' : 'false');
          });
          satzSetzen(wert);
          UI.toast(wert === 'fsrs' ? 'Ab jetzt plant FSRS' : 'Ab jetzt plant SM-2');
        });
        reihe.appendChild(k);
      }
      satzSetzen(jetzt);
      algorithm.append(titel, reihe, satz);
      const auffrisch = auffrischSection();
      const richtung = verlaufSection();
      /* REIHENFOLGE: erst was zu TUN ist (auffrischen), dann wo man STEHT
         (Themenfortschritt), dann wohin es GEHT (Verlauf). Die Richtung
         steht bewusst hinter dem Stand: sie beantwortet eine Frage, die
         man erst stellt, wenn man den Stand gesehen hat. */
      view.body.append(grid, exam, explanation, actions, details,
                       ...(auffrisch ? [auffrisch] : []),
                       topicSection(stats.topics),
                       ...(richtung ? [richtung] : []),
                       next, algorithm);
    };

    const renderSession = (): void => {
      view.body.replaceChildren();
      if (index >= session.length) {
        const done = document.createElement('div');
        done.style.padding = '26px 8px';
        done.style.textAlign = 'center';
        const title = document.createElement('h2');
        title.textContent = 'Fertig für heute';
        const text = document.createElement('p');
        text.textContent = learned + (learned === 1 ? ' Karte wiederholt.' : ' Karten wiederholt.');
        const back = button('Zur Übersicht', 'dashboard', true);
        done.append(title, text, back);
        view.body.appendChild(done);
        return;
      }
      const current = session[index];
      const [front, back] = splitCard(current);
      const editable = canEditCard(current);
      const progress = document.createElement('div');
      progress.style.color = 'var(--text-dim)';
      progress.style.fontSize = '13px';
      progress.textContent = (index + 1) + ' / ' + session.length;
      const card = document.createElement('section');
      card.className = 'karte';
      card.style.margin = '14px 0';
      card.style.minHeight = '210px';
      card.style.display = 'grid';
      card.style.alignContent = 'center';
      card.style.gap = '18px';
      const question = document.createElement('div');
      question.className = 'k-vorn';
      question.textContent = front;
      card.appendChild(question);
      if (answerOpen) {
        const separator = document.createElement('hr');
        const answer = document.createElement('div');
        answer.className = 'k-hinten';
        answer.textContent = back;
        card.append(separator, answer);
      }
      const source = sourceOf(current);
      if (source) {
        const sourceButton = button('Quelle: ' + sourceLabel(source), 'source');
        sourceButton.classList.add('k-quelle');
        card.appendChild(sourceButton);
      }
      const actions = document.createElement('div');
      actions.className = 'fbtns lern-btns';
      if (!answerOpen) actions.append(button('Antwort zeigen', 'reveal', true));
      else if (editable) {
        ([['1', 'Nochmal'], ['2', 'Schwer'], ['3', 'Gut'], ['4', 'Leicht']] as Array<[string, string]>)
          .forEach(([rating, label]) => {
            const item = button(label, 'rate-' + rating, rating === '3');
            item.dataset.rating = rating;
            actions.appendChild(item);
          });
      } else {
        const notice = document.createElement('span');
        notice.textContent = 'Nur Leserechte — diese Karte wird nicht bewertet.';
        notice.style.color = 'var(--text-dim)';
        actions.append(notice, button('Überspringen', 'skip'));
      }
      view.body.append(progress, card, actions);
    };

    const startSession = (selected: any[]): void => {
      session = selected.slice();
      index = 0; learned = 0; answerOpen = false;
      renderSession();
    };

    view.body.addEventListener('click', event => {
      const target = elementFrom(event)?.closest<HTMLElement>('[data-learning-action]');
      const action = target?.dataset.learningAction || '';
      if (action === 'start-today') { startSession(dailyQueue().all); return; }
      if (action === 'start-errors') { startSession(cards().filter(isMistake)); return; }
      if (action === 'reveal') { answerOpen = true; renderSession(); return; }
      if (action === 'dashboard') { renderDashboard(); return; }
      if (action === 'skip') { index++; answerOpen = false; renderSession(); return; }
      if (action === 'source' && session[index]) {
        const current = session[index];
        view.close();
        jumpToSource(current);
        return;
      }
      if (target?.dataset.rating && session[index]) {
        if (!canEditCard(session[index])) {
          UI.toast('Diese Karte ist nur lesbar und wird nicht bewertet.');
          return;
        }
        WissenDienst.planen(session[index], Number(target.dataset.rating));
        learned++; index++; answerOpen = false; renderSession();
      }
    });

    const keyHandler = (event: KeyboardEvent): void => {
      if (!view.root.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
      if (event.key === 'Escape') { event.preventDefault(); view.close(); return; }
      if (!session.length || index >= session.length) return;
      if (!answerOpen && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault(); answerOpen = true; renderSession(); return;
      }
      if (answerOpen && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        if (!canEditCard(session[index])) {
          UI.toast('Diese Karte ist nur lesbar und wird nicht bewertet.');
          return;
        }
        WissenDienst.planen(session[index], Number(event.key));
        learned++; index++; answerOpen = false; renderSession();
      }
    };
    document.addEventListener('keydown', keyHandler);
    view.root.addEventListener('learning-close', () =>
      document.removeEventListener('keydown', keyHandler), { once: true });
    renderDashboard();
  };

  return {
    cards, due, dailyQueue, statistics, reviewLog, topicProgress, nextExam, splitCard,
    canReadCard, canEditCard,
    sourceOf, sourceLabel, makeSourceRef, jumpToSource,
    sourceMenu, createCrop, clozeFromSelection, open
  };
})();

(window as any).Learning = Learning;
