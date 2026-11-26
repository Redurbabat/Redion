/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/inspector.ts (npm run bauen:ts). */
/* Gemeinsame Objektbedienung. Die Fläche stellt Auswahl, Verlauf und Ablage;
 * dieser Baustein kennt weder Seiten noch PDF-Koordinaten oder Store. */
interface GfxInspectorOptions {
  host: HTMLElement;
  read: () => any[];
  selected: () => ReadonlySet<string>;
  select: (ids: string[], exact?: boolean) => void;
  commit: (objects: any[]) => void;
  uid: () => string;
  zoom?: (box: { x: number; y: number; w: number; h: number }) => void;
  restoreView?: () => void;
  layout?: (command: string) => void;
  ink?: boolean;
  image?: (id: string) => Promise<Blob | null>;
  pack?: (files: { name: string; inhalt: Blob | string }[]) => Promise<Blob>;
  importFile?: (file: File, active: () => boolean) => Promise<any[]>;
}

const GfxInspector = (() => {
  const label = (o: any): string => String(o.text || o.title || ({ frame: 'Rahmen', stift: 'Strich',
    rechteck: 'Rechteck', rectangle: 'Rechteck', ellipse: 'Ellipse', verbindung: 'Verbindung', bild: 'Bild', notiz: 'Notiz',
    line: 'Linie', arrow: 'Pfeil', triangle: 'Dreieck', roundrect: 'Abgerundetes Rechteck', pen: 'Strich', text: 'Text', attachment: 'Anhang' } as any)[o.art] || o.art || 'Objekt').slice(0, 80);
  const open = (options: GfxInspectorOptions, initial = 'layers'): HTMLElement => {
    const { host, read, selected, select, commit, uid } = options;
    host.querySelector('.gfx-inspector')?.remove();
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = document.createElement('section'); panel.className = 'gfx-inspector';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', options.ink ? 'Objekte' : 'Objekte und Rahmen'); panel.tabIndex = -1;
    const heading = document.createElement('header'), title = document.createElement('strong');
    title.textContent = options.ink ? 'Objekte' : 'Objekte und Rahmen'; heading.append(title); panel.append(heading);
    const button = (container: HTMLElement, name: string, run: () => void, disabled = false): HTMLButtonElement => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.disabled = disabled;
      b.addEventListener('click', () => { run(); }); container.append(b); return b;
    };
    const close = () => { panel.remove(); previous?.isConnected && previous.focus({ preventScroll: true }); };
    button(heading, 'Schliessen', close).setAttribute('aria-label', 'Objektübersicht schliessen');
    const tabs = document.createElement('nav'); tabs.setAttribute('aria-label', 'Objektbereiche'); panel.append(tabs);
    const body = document.createElement('div'); body.className = 'gfx-inspector-body'; panel.append(body);
    let tab = initial;
    const change = (next: any[]) => { commit(next); render(); };
    const update = (fields: Record<string, unknown>) => change(read().map(o => selected().has(o.id) ||
      (fields.locked !== undefined && o.art === 'verbindung' && selected().has(o.von) && selected().has(o.nach)) ? { ...o, ...fields } : o));
    const subtitle = (text: string) => { const h = document.createElement('h3'); h.textContent = text; body.append(h); };
    const note = (text: string) => { const p = document.createElement('p'); p.textContent = text; body.append(p); };
    const editable = () => selected().size > 0 && !GfxObjects.locked(read(), selected());
    const runLayout = (command: string) => {
      if (options.layout) { options.layout(command); render(); return; }
      change(command.startsWith('rotate:') ? GfxObjects.rotate(read(), selected(), Number(command.slice(7))) : GfxObjects.align(read(), selected(), command));
    };
    const render = () => {
      if (!panel.isConnected) return;
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
      body.replaceChildren();
      if (tab === 'layers') {
        note('Oben liegt vorne. Tippen wählt die Gruppe; „Einzeln“ öffnet ein Mitglied.');
        const rows = document.createElement('div'); rows.className = 'gfx-layer-list'; body.append(rows);
        const paths = new Set<string>();
        for (const o of read().slice().reverse()) {
          const path = Array.isArray(o.groupPath) ? o.groupPath : o.groupId ? [o.groupId] : [];
          path.slice().reverse().forEach((group: string, depth: number) => {
            if (paths.has(group)) return; paths.add(group);
            const groupRow = document.createElement('div'); groupRow.className = 'gfx-layer-group';
            groupRow.style.paddingInlineStart = Math.min(depth, 8) * 12 + 'px';
            button(groupRow, 'Gruppe · ' + read().filter(x => (x.groupPath || [x.groupId]).includes(group)).length,
              () => { select(read().filter(x => (x.groupPath || [x.groupId]).includes(group)).map(x => x.id), true); render(); }); rows.append(groupRow);
          });
          const row = document.createElement('div'); row.className = 'gfx-layer-row'; row.dataset.selected = String(selected().has(o.id));
          row.style.paddingInlineStart = Math.min(path.length, 8) * 12 + 'px';
          const choose = button(row, (o.locked ? '🔒 ' : '') + label(o), () => { select([o.id]); render(); }); choose.setAttribute('aria-pressed', String(selected().has(o.id)));
          if (path.length) button(row, 'Einzeln', () => { select([o.id], true); render(); });
          rows.append(row);
        }
        if (!read().length) note('Noch keine Objekte. Zeichne oder füge eine Vorlage ein.');
        subtitle('Auswahl');
        const actions = document.createElement('div'); actions.className = 'gfx-inspector-grid'; body.append(actions);
        button(actions, 'Alle auswählen', () => { select(read().filter(o => o.art !== 'verbindung').map(o => o.id)); render(); });
        button(actions, 'Gruppieren', () => change(GfxObjects.group(read(), selected(), uid())), !editable() || selected().size < 2);
        button(actions, 'Gruppe auflösen', () => change(GfxObjects.group(read(), selected(), null)), !editable() || !read().some(o => selected().has(o.id) && o.groupId));
        button(actions, GfxObjects.locked(read(), selected()) ? 'Entsperren' : 'Sperren', () => update({ locked: !GfxObjects.locked(read(), selected()) }), !selected().size);
        for (const [id, name] of [['front', 'Ganz nach vorne'], ['forward', 'Eine Ebene vor'], ['backward', 'Eine Ebene zurück'], ['back', 'Ganz nach hinten']] as const)
          button(actions, name, () => change(GfxObjects.reorder(read(), selected(), id)), !editable());
        const attachment = read().find(o => selected().size === 1 && selected().has(o.id) && o.dateiId);
        if (attachment && options.image) button(body, 'Anhang speichern', () => {
          void options.image!(attachment.dateiId).then(blob => { if (blob) download(blob, String(attachment.fileName || attachment.text || 'Anhang')); });
        });
      } else if (tab === 'layout') {
        note('Gruppen werden als Einheit ausgerichtet. Verteilen braucht mindestens drei Einheiten.');
        const grid = document.createElement('div'); grid.className = 'gfx-inspector-grid'; body.append(grid);
        for (const [id, name] of [['left', 'Links'], ['center', 'Horizontal mittig'], ['right', 'Rechts'], ['top', 'Oben'], ['middle', 'Vertikal mittig'], ['bottom', 'Unten'], ['horizontal', 'Horizontal verteilen'], ['vertical', 'Vertikal verteilen']])
          button(grid, name!, () => runLayout(id!), !editable() || selected().size < (['horizontal', 'vertical'].includes(id!) ? 3 : 2));
        subtitle('Drehen');
        button(body, '90° im Uhrzeigersinn', () => runLayout('rotate:90'), !editable());
        const angle = document.createElement('input'); angle.type = 'number'; angle.value = '15'; angle.min = '-360'; angle.max = '360'; angle.setAttribute('aria-label', 'Drehwinkel in Grad'); body.append(angle);
        button(body, 'Um diesen Winkel drehen', () => { const n = Number(angle.value); if (Number.isFinite(n) && Math.abs(n) <= 360) runLayout('rotate:' + n); }, !editable());
        if (!options.ink) {
          subtitle('Verbinder');
          for (const [field, name, choices] of [
            ['route', 'Verlauf', [['straight', 'Gerade'], ['curve', 'Kurve'], ['orthogonal', 'Rechtwinklig']]],
            ['sourceAnchor', 'Anfang', [['auto', 'Automatisch'], ['top', 'Oben'], ['right', 'Rechts'], ['bottom', 'Unten'], ['left', 'Links']]],
            ['targetAnchor', 'Ende', [['auto', 'Automatisch'], ['top', 'Oben'], ['right', 'Rechts'], ['bottom', 'Unten'], ['left', 'Links']]]
          ] as const) {
            const l = document.createElement('label'); l.textContent = name;
            const s = document.createElement('select'); s.setAttribute('aria-label', name);
            for (const [value, text] of choices) { const option = document.createElement('option'); option.value = value; option.textContent = text; s.append(option); }
            s.value = read().find(o => selected().has(o.id) && o.art === 'verbindung')?.[field] || choices[0]![0];
            s.disabled = !editable() || !read().some(o => selected().has(o.id) && o.art === 'verbindung');
            s.addEventListener('change', () => change(read().map(o => selected().has(o.id) && o.art === 'verbindung' ? { ...o, [field]: s.value } : o)));
            l.append(s); body.append(l);
          }
        }
      } else if (tab === 'frames') {
        note('Rahmen ordnen Ausschnitte als Folien. Pfeile wechseln die Folie; Escape beendet den Vortrag.');
        if (!options.ink) {
          button(body, 'Rahmen um Auswahl', () => {
            const b = GfxObjects.bounds(read().filter(o => selected().has(o.id))) || { x: 0, y: 0, w: 720, h: 405 };
            const frame = { id: uid(), art: 'frame', x: b.x - 32, y: b.y - 48, w: b.w + 64, h: b.h + 80,
              farbe: '#529cca', text: 'Rahmen ' + (read().filter(o => o.art === 'frame').length + 1) };
            change([frame, ...read()]); select([frame.id], true); render();
          });
          const frames = read().filter(o => o.art === 'frame').sort((a, b) => (a.frameOrder || 0) - (b.frameOrder || 0));
          frames.forEach((frame, index) => {
            const row = document.createElement('div'); row.className = 'gfx-layer-row';
            button(row, (index + 1) + '. ' + label(frame), () => { select([frame.id], true); options.zoom?.(GfxShapes.rahmenVon(frame)); });
            const reorder = (delta: number) => {
              const next = frames.slice(); [next[index], next[index + delta]] = [next[index + delta], next[index]];
              change(read().map(o => o.art === 'frame' ? { ...o, frameOrder: next.findIndex(f => f.id === o.id) } : o));
            };
            button(row, '↑', () => reorder(-1), index === 0).setAttribute('aria-label', 'Rahmen nach vorne');
            button(row, '↓', () => reorder(1), index === frames.length - 1).setAttribute('aria-label', 'Rahmen nach hinten'); body.append(row);
            const name = document.createElement('input'); name.value = label(frame); name.setAttribute('aria-label', 'Rahmentitel ' + (index + 1));
            name.disabled = !!frame.locked; name.maxLength = 200;
            name.addEventListener('change', () => change(read().map(o => o.id === frame.id ? { ...o, text: name.value.trim() || 'Rahmen' } : o))); body.append(name);
          });
          button(body, 'Präsentation starten', () => { close(); present(options, frames); }, !frames.length);
        }
      } else if (tab === 'comments') {
        const objects = read().filter(o => selected().has(o.id));
        if (objects.length !== 1) { note('Wähle ein einzelnes Objekt in der Ebenenliste, um seinen Kommentarverlauf zu öffnen.'); return; }
        const object = objects[0]!; subtitle(label(object));
        for (const comment of Array.isArray(object.objectComments) ? object.objectComments : []) {
          const article = document.createElement('article'); article.className = 'gfx-object-comment';
          const text = document.createElement('p'); text.textContent = String(comment.text || ''); article.append(text);
          const date = document.createElement('small'); date.textContent = new Date(comment.created).toLocaleString('de-DE'); article.append(date);
          button(article, comment.resolved ? 'Erneut öffnen' : 'Erledigen', () => update({ objectComments: object.objectComments.map((c: any) => c.id === comment.id ? { ...c, resolved: !c.resolved } : c) }));
          button(article, 'Bearbeiten', () => {
            const editor = document.createElement('textarea'); editor.value = String(comment.text || ''); editor.rows = 3; editor.maxLength = 10000;
            editor.setAttribute('aria-label', 'Kommentar bearbeiten'); article.append(editor);
            button(article, 'Änderung speichern', () => { if (editor.value.trim()) update({ objectComments: object.objectComments.map((c: any) => c.id === comment.id ? { ...c, text: editor.value.trim() } : c) }); });
            editor.focus();
          });
          body.append(article);
        }
        const input = document.createElement('textarea'); input.rows = 3; input.maxLength = 10000; input.setAttribute('aria-label', 'Neuer Objektkommentar'); body.append(input);
        button(body, 'Kommentar hinzufügen', () => {
          if (!input.value.trim()) return;
          update({ objectComments: [...(object.objectComments || []), { id: uid(), text: input.value.trim(), created: new Date().toISOString(), resolved: false }] });
        });
      } else if (tab === 'exchange') {
        note('Die bearbeitbare Datei bewahrt Gruppen, Rahmen und Kommentare. SVG und PNG zeigen die Zeichenobjekte. Dokumentblöcke bleiben in der vollständigen Redion-Sicherung.');
        if (!options.ink) {
          const status = document.createElement('p'); status.setAttribute('role', 'status');
          const attempt = (run: () => Promise<void>) => { void run().catch(error => { status.textContent = error instanceof Error ? error.message : 'Export fehlgeschlagen.'; }); };
          button(body, 'Bearbeitbare Fläche exportieren', () => attempt(() => exportEditable(options)));
          button(body, 'SVG exportieren', () => attempt(() => exportGraphic(options, false)));
          button(body, 'PNG exportieren', () => attempt(() => exportGraphic(options, true)));
          const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,.zip,.affine'; input.setAttribute('aria-label', 'Fläche oder AFFiNE-Snapshot importieren'); body.append(input);
          body.append(status);
          input.addEventListener('change', async () => {
            const file = input.files?.[0]; if (!file) return;
            try {
              const imported = options.importFile ? await options.importFile(file, () => panel.isConnected) : GfxExchange.parse(JSON.parse(await file.text()), uid);
              if (!panel.isConnected) return;
              if (!imported.length) throw new Error('Keine unterstützten Zeichenobjekte gefunden.');
              const merged = GfxExchange.remap(imported, uid);
              change([...read(), ...merged]); select(merged.map(o => o.id)); tab = 'layers'; render();
            } catch (error) { status.textContent = error instanceof Error ? error.message : 'Die Datei konnte nicht importiert werden.'; }
          });
          subtitle('Vorlagen');
          for (const [kind, name] of [['kanban', 'Projektboard'], ['swot', 'SWOT'], ['timeline', 'Zeitstrahl'], ['retro', 'Retrospektive']])
            button(body, name!, () => { const next = template(kind!, uid); change([...read(), ...next]); select(next.map(o => o.id)); options.zoom?.(GfxObjects.bounds(next)!); });
        }
      }
    };
    for (const [id, name] of [['layers', 'Ebenen'], ['layout', 'Ausrichten'], ...(!options.ink ? [['frames', 'Rahmen']] : []), ['comments', 'Kommentare'], ...(!options.ink ? [['exchange', 'Austausch']] : [])]) {
      const b = button(tabs, name!, () => { tab = id!; render(); }); b.dataset.tab = id;
    }
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    // Eigene Zeigergesten sollen niemals die darunterliegende Fläche bewegen.
    for (const event of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) panel.addEventListener(event, e => e.stopPropagation());
    host.append(panel); render(); panel.focus({ preventScroll: true }); return panel;
  };
  const download = (blob: Blob, name: string): void => {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const exportGraphic = async (options: GfxInspectorOptions, png: boolean): Promise<void> => {
    const objects = options.read(), box = GfxObjects.bounds(objects); if (!box) return;
    const svg = GfxShapes.sv('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: `${box.x - 24} ${box.y - 24} ${box.w + 48} ${box.h + 48}`,
      width: Math.ceil(box.w + 48), height: Math.ceil(box.h + 48) }) as SVGSVGElement;
    const defs = GfxShapes.sv('defs'); GfxShapes.pfeilMarke(defs, 'export-arrow'); svg.append(defs);
    const images = new Map<string, string>();
    for (const o of objects) if (o.art === 'bild' && o.dateiId && options.image && !images.has(o.dateiId)) {
      const blob = await options.image(o.dateiId); if (!blob) throw new Error('Ein Bildanhang fehlt. Der Export wurde abgebrochen.');
      const data = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(blob); }); images.set(o.dateiId, data);
    }
    for (const o of objects.filter(o => o.art === 'verbindung')) {
      const a = objects.find(x => x.id === o.von), b = objects.find(x => x.id === o.nach);
      if (a && b) svg.append(GfxShapes.verbindungZeichne(o, GfxShapes.rahmenVon(a), GfxShapes.rahmenVon(b), 'export-arrow'));
    }
    for (const o of objects.filter(o => o.art !== 'verbindung')) svg.append(GfxShapes.zeichne(o, { pfeilMarke: 'export-arrow', bildAdresse: id => images.get(id) || null }));
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    if (!png) { download(blob, 'Zeichenfläche.svg'); return; }
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas'), factor = Math.min(2, 8192 / Math.max(box.w + 48, box.h + 48));
      canvas.width = Math.ceil((box.w + 48) * factor); canvas.height = Math.ceil((box.h + 48) * factor);
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve)); if (result) download(result, 'Zeichenfläche.png');
    } finally { URL.revokeObjectURL(url); }
  };
  const exportEditable = async (options: GfxInspectorOptions): Promise<void> => {
    const objects = JSON.parse(JSON.stringify(options.read()));
    const ids = new Set<string>(objects.filter((o: any) => o.dateiId).map((o: any) => String(o.dateiId)));
    const assets: Record<string, { path: string; mime: string }> = Object.create(null), files: { name: string; inhalt: Blob | string }[] = [];
    for (const id of ids) {
      const blob = await options.image?.(id); if (!blob) throw new Error('Ein Anhang fehlt. Die Fläche wurde nicht unvollständig exportiert.');
      const name = 'assets/' + files.length; files.push({ name, inhalt: blob }); assets[id] = { path: name, mime: blob.type };
    }
    const data = JSON.stringify({ format: 'redion-canvas', version: 1, shapes: objects, ...(ids.size ? { assets } : {}) }, null, 2);
    if (ids.size) {
      if (!options.pack) throw new Error('Der Archivexport ist nicht verfügbar.');
      files.push({ name: 'canvas.json', inhalt: data }); download(await options.pack(files), 'Zeichenfläche.redion-canvas.zip');
    } else download(new Blob([data], { type: 'application/json' }), 'Zeichenfläche.redion-canvas.json');
  };
  const present = (options: GfxInspectorOptions, frames: any[]) => {
    if (!frames.length || !options.zoom) return;
    options.host.dataset.gfxPresenting = 'true';
    const bar = document.createElement('div'); bar.className = 'gfx-presentation'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Präsentationssteuerung');
    let index = 0; const status = document.createElement('span'); status.setAttribute('role', 'status');
    const show = () => { const frame = frames[index]!; options.zoom!(GfxShapes.rahmenVon(frame)); status.textContent = `${index + 1} / ${frames.length} · ${label(frame)}`; };
    const blockDrawing = (e: Event) => { if (e.target instanceof Node && !bar.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); } };
    options.host.addEventListener('pointerdown', blockDrawing, true);
    const end = () => { document.removeEventListener('keydown', key, true); options.host.removeEventListener('pointerdown', blockDrawing, true);
      delete options.host.dataset.gfxPresenting; bar.remove(); options.restoreView?.(); };
    const key = (e: KeyboardEvent) => {
      if (['Escape', 'ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' '].includes(e.key)) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.key === 'Escape') end(); else { index = Math.max(0, Math.min(frames.length - 1, index + (['ArrowLeft', 'PageUp'].includes(e.key) ? -1 : 1))); show(); }
      }
    };
    for (const [name, run] of [['Zurück', () => { index = Math.max(0, index - 1); show(); }], ['Weiter', () => { index = Math.min(frames.length - 1, index + 1); show(); }], ['Beenden', end]] as const) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.addEventListener('click', run); bar.append(b);
    }
    bar.prepend(status); for (const event of ['pointerdown', 'pointerup']) bar.addEventListener(event, e => e.stopPropagation());
    options.host.append(bar); document.addEventListener('keydown', key, true); show();
    bar.querySelector('button')?.focus();
    new MutationObserver((_, observer) => { if (!bar.isConnected) { document.removeEventListener('keydown', key, true);
      options.host.removeEventListener('pointerdown', blockDrawing, true); delete options.host.dataset.gfxPresenting; observer.disconnect(); } }).observe(document.body, { childList: true, subtree: true });
  };
  const template = (kind: string, uid: () => string): any[] => {
    const titles = kind === 'swot' ? ['Stärken', 'Schwächen', 'Chancen', 'Risiken'] : kind === 'retro' ? ['Gut gelaufen', 'Gelernt', 'Verbessern'] : kind === 'timeline' ? ['Start', 'Meilenstein', 'Ergebnis'] : ['Offen', 'In Arbeit', 'Erledigt'];
    return titles.flatMap((text, i) => {
      const x = kind === 'swot' ? (i % 2) * 300 : i * 300, y = kind === 'swot' ? Math.floor(i / 2) * 250 : 0;
      const frame = { id: uid(), art: 'frame', x, y, w: 270, h: 210, text, farbe: '#529cca', frameOrder: i };
      const note = { id: uid(), art: 'notiz', x: x + 24, y: y + 30, w: 220, h: 140, text: 'Idee hinzufügen', farbe: GfxShapes.PALETTE[i % 8]![0] };
      return [frame, note];
    });
  };
  return { open, present, template, exportGraphic, exportEditable, download };
})();
(window as any).GfxInspector = GfxInspector;
