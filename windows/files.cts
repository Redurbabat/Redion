import fs = require('node:fs/promises');
import path = require('node:path');
import crypto = require('node:crypto');
import type { FileHandle } from 'node:fs/promises';

// Nur Dateien, die das Betriebssystem oder der native Dateiwähler übergeben
// haben. Der Renderer bekommt keine Pfade und kann keine Pfade anfordern.
const CHUNK = 1024 * 1024;
const LIMIT = 4 * 1024 * 1024 * 1024 - 1;
const extensions = new Set(['.pdf', '.redion', '.json', '.md', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.gif']);
type Source = { handle: FileHandle; name: string; size: number; modified: number; offset: number };
type Output = { handle: FileHandle; temporary: string; target: string; size: number; offset: number };

export class NativeFiles {
  private sources = new Map<string, Source>();
  private outputs = new Map<string, Output>();

  async offer(filename: string) {
    if (this.sources.size >= 16 || !path.isAbsolute(filename) || !extensions.has(path.extname(filename).toLowerCase())) return null;
    const info = await fs.lstat(filename);
    if (!info.isFile() || info.isSymbolicLink() || info.size > LIMIT) throw new Error('Datei nicht unterstützt oder größer als 4 GB.');
    const handle = await fs.open(filename, 'r');
    const current = await handle.stat();
    if (current.size !== info.size || current.mtimeMs !== info.mtimeMs || current.ino !== info.ino) {
      await handle.close(); throw new Error('Die Datei wurde beim Öffnen verändert.');
    }
    const id = crypto.randomUUID();
    this.sources.set(id, { handle, name: path.basename(filename), size: current.size, modified: current.mtimeMs, offset: 0 });
    return id;
  }

  pending() {
    return [...this.sources].map(([id, source]) => ({ id, name: source.name, size: source.size }));
  }

  async read(id: string, offset: number) {
    const source = this.sources.get(id);
    if (!source || !Number.isSafeInteger(offset) || offset !== source.offset || offset >= source.size) throw new Error('Ungültiger Dateizugriff.');
    const info = await source.handle.stat();
    if (info.size !== source.size || info.mtimeMs !== source.modified) throw new Error('Die Quelldatei wurde verändert. Bitte erneut öffnen.');
    const buffer = Buffer.alloc(Math.min(CHUNK, source.size - offset));
    const { bytesRead } = await source.handle.read(buffer, 0, buffer.length, offset);
    if (bytesRead !== buffer.length) throw new Error('Die Datei konnte nicht vollständig gelesen werden.');
    const after = await source.handle.stat();
    if (after.size !== source.size || after.mtimeMs !== source.modified) throw new Error('Die Quelldatei wurde beim Lesen verändert.');
    source.offset += bytesRead;
    return Uint8Array.from(buffer);
  }

  async release(id: string) {
    const source = this.sources.get(id);
    this.sources.delete(id);
    await source?.handle.close();
  }

  async begin(target: string, size: number) {
    if (this.outputs.size || !path.isAbsolute(target) || !Number.isSafeInteger(size) || size < 0 || size > LIMIT) throw new Error('Ungültiger Export.');
    const temporary = path.join(path.dirname(target), '.redion-' + crypto.randomUUID() + '.tmp');
    const handle = await fs.open(temporary, 'wx', 0o600);
    const id = crypto.randomUUID();
    this.outputs.set(id, { handle, temporary, target, size, offset: 0 });
    return id;
  }

  async write(id: string, bytes: Uint8Array) {
    const output = this.outputs.get(id);
    if (!output || !(bytes instanceof Uint8Array) || !bytes.length || bytes.length > CHUNK || output.offset + bytes.length > output.size) throw new Error('Ungültiges Exportstück.');
    // In jedem Kanal gibt es nur eine sequenzielle Schreibkette.
    const { bytesWritten } = await output.handle.write(bytes, 0, bytes.length, output.offset);
    if (bytesWritten !== bytes.length) throw new Error('Exportstück nicht vollständig geschrieben.');
    output.offset += bytesWritten;
  }

  async commit(id: string) {
    const output = this.outputs.get(id);
    if (!output || output.offset !== output.size) throw new Error('Export unvollständig. Die Zieldatei bleibt unverändert.');
    await output.handle.sync();
    await output.handle.close();
    await fs.rename(output.temporary, output.target);
    this.outputs.delete(id);
    return true;
  }

  async cancel(id: string) {
    const output = this.outputs.get(id);
    if (!output) return;
    this.outputs.delete(id);
    await output.handle.close().catch(() => {});
    // Ausschließlich die von begin() selbst erzeugte temporäre Datei.
    await fs.unlink(output.temporary).catch(() => {});
  }

  async close() {
    await Promise.all([...this.sources.keys()].map(id => this.release(id)));
    await Promise.all([...this.outputs.keys()].map(id => this.cancel(id)));
  }
}

export function trustedSender(event: { sender: unknown; senderFrame?: unknown }, contents: { mainFrame: unknown } | undefined) {
  if (!contents || event.sender !== contents || event.senderFrame !== contents.mainFrame) return false;
  const frame = event.senderFrame as { url?: string } | undefined;
  try {
    const url = new URL(frame?.url || '');
    url.hash = ''; // Redions bestehende Navigation verwendet Fragmentziele.
    return url.href === 'redion-local://app/index.html';
  } catch { return false; }
}

export function safeExportName(raw: unknown) {
  if (typeof raw !== 'string' || raw.length > 180 || !raw.trim() || /[\\/:*?"<>|\x00-\x1f]/.test(raw) || /[. ]$/.test(raw) || /^\./.test(raw) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(raw)) throw new Error('Ungültiger Dateiname.');
  return raw;
}
