/*
 * iOS-only inbound Share Sheet bridge. Plain text and HTTPS links only in
 * the first release; neither foreign files nor external HTML are evaluated.
 * The share extension keeps its own App Group JSON until Store.flush resolves.
 * Never touch the existing IndexedDB schema or web/PWA bundle.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validIncomingShare(raw) {
  if (!raw || typeof raw !== 'object' || !UUID.test(raw.id)) return null;
  if (raw.kind !== 'text' && raw.kind !== 'url') return null;
  if (typeof raw.value !== 'string' || !raw.value.trim() ||
      raw.value.length > 60000) return null;
  const value = raw.value.trim();
  if (raw.kind === 'url') {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      if (url.username || url.password || url.href.length > 4096) return null;
      return { id: raw.id.toLowerCase(), kind: 'url', value: url.href };
    } catch { return null; }
  }
  return { id: raw.id.toLowerCase(), kind: 'text', value };
}

export function createIosShareInbox({ store, app, document: doc, clock = () => new Date() }) {
  if (!store || typeof store.addPage !== 'function' ||
      typeof store.addBlock !== 'function' ||
      typeof store.flush !== 'function') {
    throw new TypeError('Redion-Speicher ist nicht bereit.');
  }
  const ongoing = new Map();
  const receive = (payload) => {
    const item = validIncomingShare(payload);
    if (!item || doc?.hidden || store.speichertNicht?.()) return Promise.resolve(false);
    if (ongoing.has(item.id)) return ongoing.get(item.id);
    const operation = (async () => {
      const key = 'iosEingang:' + item.id;
      if (store.getMeta(key, false) === true) return true;
      const name = item.kind === 'url' ? (() => {
        try { return new URL(item.value).hostname; } catch { return 'Weblink'; }
      })() : item.value.split('\n').find(s => s.trim())?.slice(0, 70) || 'Geteilter Text';
      const title = ('Von iPhone geteilt · ' + name).slice(0, 110);
      // Add a normal Redion page to the local-first store. Only plain text:
      // no HTML injection, no WebView navigation and no network requests.
      const page = store.addPage(null, { text: title });
      // A literal text block intentionally does not trigger a webpage
      // preview/fetch. Foreign links remain inert until opened by the user.
      store.addBlock(page.id, 'text', { text: item.value });
      store.setMeta(key, true);
      await store.flush();
      try { app?.zeichneBaum?.(); app?.oeffne?.(page.id); } catch {}
      return true;
    })().catch(() => false).finally(() => ongoing.delete(item.id));
    ongoing.set(item.id, operation);
    return operation;
  };
  return Object.freeze({ receive });
}
