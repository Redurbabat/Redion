/** Nur der native iPhone-Build lädt diesen Adapter. Keine eigenen Nutzerdaten. */
type Payload = { id: string; name: string; size: number; path: string };
type Fs = {
  stat(options: { path: string; directory: string }): Promise<{ size: number }>;
  readFileInChunks(options: { path: string; directory: string; chunkSize: number },
    callback: (chunk: { data: string | Blob } | null, error?: unknown) => void): Promise<string>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function validateDocument(raw: unknown): Payload | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Payload;
  if (typeof value.id !== 'string' || !uuid.test(value.id) || typeof value.name !== 'string' ||
      !value.name || value.name.length > 255 || /[\\/\x00-\x1f]/.test(value.name) ||
      !Number.isSafeInteger(value.size) || value.size < 0 || value.size >= 4 * 1024 ** 3) return null;
  const extension = value.name.match(/\.(pdf|redion|json|txt|md|png|jpe?g|webp|gif)$/i)?.[1]?.toLowerCase();
  if (!extension || value.path !== 'NativeInbox/' + value.id + '/payload.' + extension) return null;
  return { id: value.id, name: value.name, size: value.size, path: value.path };
}

export function createNativeDocumentInbox({ filesystem, directory, ready, importFile, onError }: {
  filesystem: Fs; directory: string; ready(): boolean;
  importFile(file: File): Promise<void>; onError(error: unknown): void;
}) {
  const running = new Map<string, Promise<string>>();
  const done = new Set<string>();
  async function receive(raw: unknown): Promise<string> {
    const item = validateDocument(raw);
    if (!item) return 'error';
    if (!ready()) return 'wait';
    if (done.has(item.id)) return 'done';
    const pending = running.get(item.id);
    if (pending) return pending;
    const task = (async () => {
      try {
        if ((await filesystem.stat({ path: item.path, directory })).size !== item.size) throw new Error('Die übergebene Datei ist unvollständig.');
        const file = await new Promise<File>((resolve, reject) => {
          const chunks: BlobPart[] = [];
          let length = 0;
          let ended = false;
          const timer = setTimeout(() => { ended = true; reject(new Error('Dateiübernahme dauert zu lange. Bitte erneut öffnen.')); }, 60000);
          const fail = (error: unknown) => { if (!ended) { ended = true; clearTimeout(timer); reject(error); } };
          const finish = () => {
            if (ended) return;
            ended = true; clearTimeout(timer);
            if (length !== item.size) reject(new Error('Die Datei wurde nicht vollständig gelesen.'));
            else resolve(new File(chunks, item.name));
          };
          void filesystem.readFileInChunks({ path: item.path, directory, chunkSize: 1024 * 1024 }, (chunk, error) => {
            if (ended) return;
            if (error || !chunk || typeof chunk.data !== 'string') { fail(error || new Error('Ungültiges Dateistück.')); return; }
            if (!chunk.data) { finish(); return; }
            try {
              if (chunk.data.length > 1400000) throw new Error('Dateistück zu groß.');
              const rawBytes = atob(chunk.data);
              const bytes = Uint8Array.from(rawBytes, char => char.charCodeAt(0));
              length += bytes.length;
              if (length > item.size) throw new Error('Datei größer als angekündigt.');
              chunks.push(new Blob([bytes]));
            } catch (failure) { fail(failure); }
          }).catch(fail);
        });
        await importFile(file);
        done.add(item.id);
        if (done.size > 64) done.delete(done.values().next().value!);
        return 'done';
      } catch (error) { onError(error); return 'error'; }
      finally { running.delete(item.id); }
    })();
    running.set(item.id, task);
    return task;
  }
  return { receive };
}
