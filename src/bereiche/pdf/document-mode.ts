/* ============================================================================
 * bereiche/pdf/document-mode.ts — ein Arbeitsraum fuer vorhandene Dokumente
 * ----------------------------------------------------------------------------
 * Der Dokumentmodus ist nur eine Ansicht. Er legt weder PDF-Seiten noch
 * Blaetter ein zweites Mal ab: dieselben `pdfseite`-/`blatt`-Bloecke werden
 * mit Seitenleiste, Arbeitsflaeche und Inspector zusammengesetzt (E126).
 * ==========================================================================*/

const DocumentMode = (() => {
  type DocumentState = {
    index: number;
    zoom: number;
    thumbnailsOpen: boolean;
    inspectorOpen: boolean;
  };

  type SourceRegion = { x: number; y: number; width: number; height: number };

  const states = new Map<string, DocumentState>();

  const stateFor = (pageId: string): DocumentState => {
    const known = states.get(pageId);
    if (known) return known;
    const kompakt = typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 1100px)').matches;
    const created = { index: 0, zoom: 100, thumbnailsOpen: false, inspectorOpen: !kompakt };
    states.set(pageId, created);
    return created;
  };

  /** Dokumentbausteine auch innerhalb vorhandener Spalten finden. */
  const documentsIn = (page: any): any[] => {
    if (!page?.id) return [];
    const found: any[] = [];
    const seen = new Set<string>();
    const visit = (id: string, depth: number): void => {
      if (depth > 8 || seen.has(id)) return;
      seen.add(id);
      Store.childrenOf(id).forEach((block: any) => {
        if (!block || block.alive === false) return;
        if (block.type === 'pdfseite' || block.type === 'blatt') found.push(block);
        else if (block.type === 'columns' || block.type === 'columns3' || block.type === 'spalte')
          visit(block.id, depth + 1);
      });
    };
    visit(page.id, 0);
    return found.sort((left, right) => {
      if (left.quelleId && left.quelleId === right.quelleId)
        return (Number(left.nr) || 0) - (Number(right.nr) || 0);
      return 0;
    });
  };

  const available = (page: any): boolean => documentsIn(page).length > 0;
  const active = (page: any): boolean => !!page?.dokumentModus && available(page);

  /** Vor einem Deep-Link den einen Dokumentblock waehlen, der gleich
      gerendert werden soll. Der Zustand ist nur Ansicht und wird nicht als
      zweite Dokumentstruktur gespeichert. */
  const select = (page: any, blockId: string): boolean => {
    const index = documentsIn(page).findIndex(block => block.id === blockId);
    if (index < 0) return false;
    stateFor(page.id).index = index;
    return true;
  };

  const toggle = (page: any, next?: boolean): void => {
    if (!page?.id || (!available(page) && next !== false)) return;
    Store.updateBlock(page.id, { dokumentModus: next ?? !page.dokumentModus });
    App.zeichneSeite();
  };

  const sourceLabel = (documentBlock: any): string =>
    documentBlock.type === 'pdfseite'
      ? 'PDF · Seite ' + (Number(documentBlock.nr) || 1)
      : 'A4-Blatt';

  const linkedObjects = (page: any, documentBlock: any): any[] =>
    Object.values<any>(Store.cache.blocks).filter(block => {
      if (!block?.alive || !block.sourceRef) return false;
      const source = block.sourceRef;
      return source.blockId === documentBlock.id ||
        (!source.blockId && source.pageId === page.id);
    });

  const thumbnail = (documentBlock: any, index: number, selected: boolean): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'document-thumbnail' + (selected ? ' is-selected' : '');
    button.dataset.documentIndex = String(index);
    button.setAttribute('aria-label', sourceLabel(documentBlock) + ' öffnen');

    const preview = document.createElement('span');
    preview.className = 'document-thumbnail-preview';
    if (documentBlock.type === 'pdfseite' && documentBlock.bildDateiId && typeof Dateien !== 'undefined') {
      const image = document.createElement('img');
      image.alt = '';
      image.loading = 'lazy';
      /* Die Adresse selbst ist bereits Arbeit: sie liest alle Chunks und legt
         eine Blob-URL an. Darum hier nur die Kennung vormerken; geladen wird
         unten erst fuer wirklich sichtbare Vorschaubilder. */
      image.dataset.documentThumbnailFile = documentBlock.bildDateiId;
      preview.appendChild(image);
    } else {
      const blank = document.createElement('span');
      blank.className = 'document-thumbnail-blank';
      blank.textContent = documentBlock.type === 'blatt' ? '✎' : 'PDF';
      preview.appendChild(blank);
    }
    const label = document.createElement('span');
    label.className = 'document-thumbnail-label';
    label.textContent = sourceLabel(documentBlock);
    button.append(preview, label);
    return button;
  };

  /** Nur die sichtbare Handvoll Vorschaubilder aus IndexedDB holen. Ein
      geschlossenes mobiles Panel hat keinen sichtbaren Schnitt und loest
      deshalb auch bei Dokumenten mit hunderten Seiten keine Lesewelle aus. */
  const activateVisibleThumbnails = (panel: HTMLElement): void => {
    let scheduled = false;
    const loadVisible = (): void => {
      scheduled = false;
      if (!panel.isConnected) return;
      const panelRect = panel.getBoundingClientRect();
      if (panelRect.width < 2 || panelRect.height < 2 ||
          panelRect.bottom <= 0 || panelRect.top >= window.innerHeight ||
          panelRect.right <= 0 || panelRect.left >= window.innerWidth) return;
      const top = Math.max(0, panelRect.top) - 220;
      const bottom = Math.min(window.innerHeight, panelRect.bottom) + 220;
      panel.querySelectorAll<HTMLImageElement>('img[data-document-thumbnail-file]').forEach(image => {
        if (image.src || image.dataset.loading === 'true') return;
        const rect = image.getBoundingClientRect();
        if (rect.bottom < top || rect.top > bottom) return;
        const fileId = image.dataset.documentThumbnailFile;
        if (!fileId) return;
        const known = Dateien.adresseBekannt?.(fileId);
        if (known) { image.src = known; return; }
        image.dataset.loading = 'true';
        Dateien.adresse(fileId).then((url: string | null) => {
          if (url && image.isConnected) image.src = url;
          delete image.dataset.loading;
        }).catch(() => { delete image.dataset.loading; });
      });
    };
    const schedule = (): void => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(loadVisible);
    };
    panel.addEventListener('scroll', schedule, { passive: true });
    schedule();
  };

  const renderInspector = (container: HTMLElement, page: any, documentBlock: any): void => {
    const links = linkedObjects(page, documentBlock);
    const cards = links.filter(block => block.type === 'flashcard');
    const tasks = links.filter(block => block.type === 'todo');
    const notes = links.filter(block => block.type !== 'flashcard' && block.type !== 'todo');

    container.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'document-inspector-heading';
    const title = document.createElement('strong');
    title.textContent = page.text || 'Ohne Titel';
    const close = document.createElement('button');
    close.type = 'button';
    close.dataset.documentAction = 'inspector-close';
    close.setAttribute('aria-label', 'Inspector schließen');
    close.textContent = '✕';
    heading.append(title, close);

    const source = document.createElement('div');
    source.className = 'document-inspector-source';
    source.textContent = sourceLabel(documentBlock);

    const actions = document.createElement('div');
    actions.className = 'document-inspector-actions';
    const makeAction = (action: string, label: string): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.documentAction = action;
      button.textContent = label;
      return button;
    };
    actions.append(
      makeAction('source-actions', '＋ Aus Inhalt'),
      makeAction('select-region', '⌗ Ausschnitt'),
      makeAction('recognize', '⌁ Erkennen')
    );

    const summary = document.createElement('div');
    summary.className = 'document-inspector-summary';
    [['🎴', 'Lernkarten', cards.length], ['☑', 'Aufgaben', tasks.length], ['¶', 'Notizen', notes.length]]
      .forEach(([icon, label, count]) => {
        const row = document.createElement('div');
        const left = document.createElement('span');
        left.textContent = String(icon) + ' ' + String(label);
        const number = document.createElement('b');
        number.textContent = String(count);
        row.append(left, number);
        summary.appendChild(row);
      });

    const list = document.createElement('div');
    list.className = 'document-inspector-list';
    links.slice(0, 24).forEach(block => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.documentOpen = block.id;
      const icon = block.type === 'flashcard' ? '🎴' : block.type === 'todo' ? '☑' : '¶';
      button.textContent = icon + ' ' + String(block.text || 'Ohne Text').replace(/::.*$/, '').slice(0, 90);
      list.appendChild(button);
    });
    if (!links.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Noch keine Notiz, Aufgabe oder Karte ist mit dieser Stelle verbunden.';
      list.appendChild(empty);
    }
    container.append(heading, source, actions, summary, list);
  };

  const renderDocument = (container: HTMLElement, block: any): void => {
    container.replaceChildren();
    /* Auch diese alternative Ansicht muss denselben Block eindeutig im DOM
       tragen wie der normale Editor. Deep-Links, Rollen und Hervorheben
       suchen absichtlich nach `data-bid`; ohne die Kennung war zwar die
       richtige Dokumentseite sichtbar, der Sprung galt aber nie als
       angekommen. Der Stage-Container ist bereits die Hülle dieses einen
       Blocks, deshalb braucht es dafür keinen zweiten Blockknoten. */
    container.dataset.bid = block.id;
    container.appendChild(block.type === 'pdfseite' ? PdfSeite.zeichne(block) : Blatt.zeichne(block));
  };

  const selectRegion = (
    paper: HTMLElement,
    documentBlock: any,
    done: (region: SourceRegion) => void
  ): void => {
    paper.classList.add('document-selecting');
    const overlay = document.createElement('div');
    overlay.className = 'document-region-overlay';
    const box = document.createElement('div');
    box.className = 'document-region-box';
    overlay.appendChild(box);
    paper.appendChild(overlay);

    let start: { x: number; y: number } | null = null;
    let end: { x: number; y: number } | null = null;
    const point = (event: PointerEvent): { x: number; y: number } => {
      const rect = overlay.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
        y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
      };
    };
    const draw = (): void => {
      if (!start || !end) return;
      const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x), height = Math.abs(end.y - start.y);
      box.style.left = x + 'px'; box.style.top = y + 'px';
      box.style.width = width + 'px'; box.style.height = height + 'px';
    };
    const finish = (event: PointerEvent): void => {
      event.preventDefault(); event.stopPropagation();
      end = point(event); draw();
      const rect = overlay.getBoundingClientRect();
      const width = Number(documentBlock.bw) || Number(documentBlock.blattBreite) || SheetSpace.A4_BREITE;
      const height = Number(documentBlock.bh) || Number(documentBlock.blattHoehe) || SheetSpace.A4_HOEHE;
      const x1 = Math.min(start?.x || 0, end.x), y1 = Math.min(start?.y || 0, end.y);
      const x2 = Math.max(start?.x || 0, end.x), y2 = Math.max(start?.y || 0, end.y);
      cleanup();
      if (x2 - x1 < 8 || y2 - y1 < 8 || !rect.width || !rect.height) return;
      done({
        x: x1 / rect.width * width,
        y: y1 / rect.height * height,
        width: (x2 - x1) / rect.width * width,
        height: (y2 - y1) / rect.height * height
      });
    };
    const move = (event: PointerEvent): void => {
      if (!start) return;
      event.preventDefault(); event.stopPropagation(); end = point(event); draw();
    };
    const down = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      start = point(event); end = start; draw();
      try { overlay.setPointerCapture(event.pointerId); } catch { /* optional */ }
    };
    const cleanup = (): void => {
      overlay.removeEventListener('pointerdown', down, true);
      overlay.removeEventListener('pointermove', move, true);
      overlay.removeEventListener('pointerup', finish, true);
      overlay.remove(); paper.classList.remove('document-selecting');
    };
    overlay.addEventListener('pointerdown', down, true);
    overlay.addEventListener('pointermove', move, true);
    overlay.addEventListener('pointerup', finish, true);
  };

  const openSourceActions = (page: any, documentBlock: any, region?: SourceRegion): void => {
    const learning = (window as any).Learning;
    if (!learning?.sourceMenu) {
      UI.toast('Die Lernwerkzeuge sind noch nicht geladen.');
      return;
    }
    learning.sourceMenu(page, documentBlock, region || null);
  };

  const render = (wrap: HTMLElement, page: any): boolean => {
    const documents = documentsIn(page);
    if (!documents.length) return false;
    const state = stateFor(page.id);
    state.index = Math.max(0, Math.min(state.index, documents.length - 1));
    const current = documents[state.index];
    if (!current) return false;

    const workspace = document.createElement('section');
    workspace.className = 'document-workspace';
    workspace.dataset.pageId = page.id;

    const top = document.createElement('div');
    top.className = 'document-topbar';
    const topButton = (action: string, text: string, label: string): HTMLButtonElement => {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.documentAction = action;
      button.setAttribute('aria-label', label); button.textContent = text;
      return button;
    };
    top.append(
      topButton('thumbnails', '☰', 'Seitenübersicht öffnen'),
      topButton('previous', '‹', 'Vorherige Seite'),
      topButton('next', '›', 'Nächste Seite')
    );
    const position = document.createElement('span');
    position.className = 'document-position';
    position.textContent = 'Seite ' + (state.index + 1) + '/' + documents.length;
    const zoom = document.createElement('input');
    zoom.type = 'range'; zoom.min = '60'; zoom.max = '180'; zoom.step = '10';
    zoom.value = String(state.zoom); zoom.dataset.documentZoom = '';
    zoom.setAttribute('aria-label', 'Dokumentzoom');
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'document-zoom-label'; zoomLabel.textContent = state.zoom + ' %';
    top.append(position, zoom, zoomLabel,
      topButton('inspector', 'ⓘ', 'Notizen und Verknüpfungen öffnen'),
      topButton('exit', 'Normale Seite', 'Dokumentmodus verlassen'));

    const body = document.createElement('div');
    body.className = 'document-body';
    const thumbnails = document.createElement('aside');
    thumbnails.className = 'document-thumbnails' + (state.thumbnailsOpen ? ' is-open' : '');
    const thumbHeader = document.createElement('div');
    thumbHeader.className = 'document-panel-header';
    const thumbTitle = document.createElement('strong'); thumbTitle.textContent = 'Seiten';
    const thumbClose = topButton('thumbnails-close', '✕', 'Seitenübersicht schließen');
    thumbHeader.append(thumbTitle, thumbClose); thumbnails.appendChild(thumbHeader);
    documents.forEach((block, index) => thumbnails.appendChild(thumbnail(block, index, index === state.index)));

    const center = document.createElement('main');
    center.className = 'document-center';
    const stage = document.createElement('div');
    stage.className = 'document-stage';
    stage.style.width = state.zoom + '%';
    renderDocument(stage, current);
    center.appendChild(stage);

    const inspector = document.createElement('aside');
    inspector.className = 'document-inspector' + (state.inspectorOpen ? ' is-open' : '');
    renderInspector(inspector, page, current);
    body.append(thumbnails, center, inspector);
    workspace.append(top, body);
    wrap.appendChild(workspace);
    requestAnimationFrame(() => {
      thumbnails.querySelector<HTMLElement>('.document-thumbnail.is-selected')
        ?.scrollIntoView({ block: 'nearest' });
      activateVisibleThumbnails(thumbnails);
    });

    const rerender = (): void => App.zeichneSeite();
    workspace.addEventListener('click', event => {
      const element = event.target instanceof Element ? event.target : null;
      const thumb = element?.closest<HTMLElement>('[data-document-index]');
      if (thumb?.dataset.documentIndex) {
        state.index = Number(thumb.dataset.documentIndex) || 0;
        state.thumbnailsOpen = false; rerender(); return;
      }
      const open = element?.closest<HTMLElement>('[data-document-open]');
      if (open?.dataset.documentOpen) {
        const target = Store.getBlock(open.dataset.documentOpen);
        const sourcePage = target ? Links.seiteVon(target.id) : null;
        if (sourcePage) { toggle(page, false); App.oeffne(sourcePage.id); }
        return;
      }
      const action = element?.closest<HTMLElement>('[data-document-action]')?.dataset.documentAction;
      if (!action) return;
      if (action === 'previous') { state.index = Math.max(0, state.index - 1); rerender(); }
      if (action === 'next') { state.index = Math.min(documents.length - 1, state.index + 1); rerender(); }
      if (action === 'thumbnails') { state.thumbnailsOpen = !state.thumbnailsOpen; rerender(); }
      if (action === 'thumbnails-close') { state.thumbnailsOpen = false; rerender(); }
      if (action === 'inspector') { state.inspectorOpen = !state.inspectorOpen; rerender(); }
      if (action === 'inspector-close') { state.inspectorOpen = false; rerender(); }
      if (action === 'exit') toggle(page, false);
      if (action === 'source-actions') openSourceActions(page, current);
      if (action === 'select-region' || action === 'recognize') {
        const paper = stage.querySelector<HTMLElement>('.blatt-papier');
        if (!paper) return;
        selectRegion(paper, current, region => {
          if (action === 'recognize') {
            const recognition = (window as any).Recognition;
            if (recognition?.fromSource) recognition.fromSource(page, current, region);
            else UI.toast('Die Erkennung ist noch nicht geladen.');
          } else openSourceActions(page, current, region);
        });
      }
    });
    zoom.addEventListener('input', () => {
      state.zoom = Number(zoom.value) || 100;
      stage.style.width = state.zoom + '%'; zoomLabel.textContent = state.zoom + ' %';
    });
    return true;
  };

  return { available, active, select, toggle, documentsIn, render, sourceLabel };
})();

(window as any).DocumentMode = DocumentMode;
