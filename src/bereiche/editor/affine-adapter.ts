/* Eigenständiger Adapter; keine Übernahme von AFFiNE-Quellcode.
 * Der Host bleibt für Berechtigungen, Speicherung und Verlauf verantwortlich. */
type RedionAffineBlock = { id: string; type: string; text?: string; content?: string[]; parentId?: string | null; [key: string]: unknown };
type RedionAffineSnapshot = { rootId: string; blocks: RedionAffineBlock[] };
type RedionAffineHost = {
    read: (rootId: string) => RedionAffineSnapshot;
    open: (rootId: string) => void;
    render: (container: HTMLElement, rootId: string, readonly: boolean) => () => void;
    subscribe: (listener: () => void) => () => void;
    updateText: (id: string, text: string) => void;
    move: (id: string, targetId: string, after: boolean) => void;
    undo: () => void;
    redo: () => void;
  };
const RedionAffineEditor = (() => {
  function validate(snapshot: RedionAffineSnapshot): RedionAffineSnapshot {
    const copy = structuredClone(snapshot);
    const map = new Map<string, RedionAffineBlock>();
    for (const block of copy.blocks) {
      if (!block.id || !block.type || map.has(block.id)) throw new Error('Ungültige Blockkennung');
      map.set(block.id, block);
    }
    if (!map.has(copy.rootId)) throw new Error('Dokument fehlt');
    const visited = new Set<string>();
    const stack = [copy.rootId];
    while (stack.length) {
      const id = stack.pop()!;
      if (visited.has(id)) throw new Error('Mehrfachreferenz oder Blockkreis');
      visited.add(id);
      const block = map.get(id);
      if (!block) throw new Error('RedionAffineBlock fehlt');
      for (const child of block.content ?? []) {
        const record = map.get(child);
        if (!record || record.parentId !== id) throw new Error('Ungültige Elternkennung');
        stack.push(child);
      }
    }
    if (visited.size !== map.size) throw new Error('Nicht erreichbare Blöcke');
    return copy;
  }
  function outline(snapshot: RedionAffineSnapshot) {
    const data = validate(snapshot);
    const map = new Map(data.blocks.map(block => [block.id, block]));
    const result: { id: string; text: string; level: number }[] = [];
    const stack = [...(map.get(data.rootId)?.content ?? [])].reverse();
    while (stack.length) {
      const block = map.get(stack.pop()!)!;
      const match = /^h([1-3])$/.exec(block.type);
      if (match) result.push({ id: block.id, text: block.text ?? '', level: Number(match[1]) });
      if (block.type !== 'page') stack.push(...(block.content ?? []).slice().reverse());
    }
    return result;
  }
  function create(host: RedionAffineHost) {
    let rootId: string | null = null;
    let container: HTMLElement | null = null;
    let stopRender: (() => void) | null = null;
    let stopSubscription: (() => void) | null = null;
    let locked = true;
    const listeners = new Set<(snapshot: RedionAffineSnapshot) => void>();
    const serializeDocument = (): RedionAffineSnapshot => {
      if (rootId === null) throw new Error('Kein Dokument geöffnet');
      const snapshot = validate(host.read(rootId));
      if (snapshot.rootId !== rootId) throw new Error('Falsches Dokument');
      return snapshot;
    };
    const refresh = () => {
      stopRender?.();
      stopRender = null;
      if (container && rootId !== null) stopRender = host.render(container, rootId, locked);
    };
    const assertWritable = () => {
      if (locked || rootId === null) throw new Error('Dokument ist schreibgeschützt oder geschlossen');
    };
    return {
      mount(target: HTMLElement) {
        if (container) throw new Error('Editor ist bereits eingebunden');
        container = target;
        refresh();
        stopSubscription = host.subscribe(() => {
          if (rootId !== null) for (const listener of listeners) listener(serializeDocument());
        });
      },
      unmount() {
        stopSubscription?.();
        stopRender?.();
        stopSubscription = stopRender = null;
        container = null;
        rootId = null;
        locked = true;
        listeners.clear();
      },
      loadDocument(id: string) {
        if (validate(host.read(id)).rootId !== id) throw new Error('Falsches Dokument');
        host.open(id);
        rootId = id;
        refresh();
      },
      serializeDocument,
      onChange(listener: (snapshot: RedionAffineSnapshot) => void) {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      },
      readonly(value: boolean) { locked = value; refresh(); },
      updateText(id: string, text: string) {
        assertWritable();
        if (!serializeDocument().blocks.some(block => block.id === id)) throw new Error('Fremder Block');
        host.updateText(id, text);
      },
      move(id: string, targetId: string, after = false) {
        assertWritable();
        const snapshot = serializeDocument();
        const map = new Map(snapshot.blocks.map(block => [block.id, block]));
        if (id === snapshot.rootId || targetId === snapshot.rootId || !map.has(id) || !map.has(targetId)) throw new Error('Ungültiges Verschiebeziel');
        for (let current = map.get(targetId); current; current = current.parentId ? map.get(current.parentId) : undefined) {
          if (current.id === id) throw new Error('Blockkreis');
          if (current.id === snapshot.rootId) break;
        }
        host.move(id, targetId, after);
      },
      undo() { assertWritable(); host.undo(); },
      redo() { assertWritable(); host.redo(); },
      outline() { return outline(serializeDocument()); },
      exportJSON() { return JSON.stringify(serializeDocument()); },
      parseJSON(text: string) { return validate(JSON.parse(text) as RedionAffineSnapshot); }
    };
  }
  return { validate, outline, create };
})();
