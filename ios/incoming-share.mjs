/*
 * Redion iOS-only Share Sheet ingestion. Text/HTTP(S) URLs stay inert.
 *
 * A share is persisted as TWO regular Redion blocks with deterministic IDs:
 * the page and its text child. Store.flush() writes both in one IndexedDB
 * transaction. Neither an asynchronous setMeta() nor any sidecar receipt
 * may claim success before that transaction commits.
 *
 * The App Group JSON is deleted by Swift ONLY when receive() returns true.
 * There is no IndexedDB schema change, cloud sync, or Web/PWA integration.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validIncomingShare(raw) {
  if (!raw || typeof raw !== 'object' ||
      typeof raw.id !== 'string' || !UUID.test(raw.id)) return null;
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

export function shareBlockIds(id) {
  if (typeof id !== 'string' || !UUID.test(id)) return null;
  const suffix = id.toLowerCase();
  return Object.freeze({
    page: 'ios-share-page-' + suffix,
    content: 'ios-share-content-' + suffix
  });
}

export function createIosShareInbox({ store, app, document: doc }) {
  if (!store || typeof store.addPage !== 'function' ||
      typeof store.addBlock !== 'function' ||
      typeof store.getBlock !== 'function' ||
      typeof store.flush !== 'function' ||
      typeof store.speichertNicht !== 'function') {
    throw new TypeError('Redion-Speicher ist nicht bereit.');
  }

  const ongoing = new Map();

  const receive = (payload) => {
    const item = validIncomingShare(payload);
    // In-memory-only operation would risk losing data after native ACK.
    if (!item || doc?.hidden || store.speichertNicht()) return Promise.resolve(false);
    if (ongoing.has(item.id)) return ongoing.get(item.id);

    const operation = (async () => {
      const ids = shareBlockIds(item.id);
      let page = store.getBlock(ids.page);
      let child = store.getBlock(ids.content);

      // A collision with unrelated data must not overwrite an existing page.
      if (page && (page.type !== 'page' || page.iosShareId !== item.id)) return false;
      if (child && (child.type !== 'text' || child.iosShareId !== item.id ||
                    child.parentId !== ids.page)) return false;

      if (!page) {
        const firstLine = item.kind === 'url'
          ? new URL(item.value).hostname
          : item.value.split('\n').find(line => line.trim())?.slice(0, 70) || 'Geteilter Text';
        page = store.addPage(null, {
          id: ids.page,
          text: ('Von iPhone geteilt · ' + firstLine).slice(0, 110),
          icon: item.kind === 'url' ? '🔗' : '📥',
          iosShareId: item.id
        });
      }
      if (!child) {
        // No automatic bookmark preview, WebKit navigation, or downloads.
        child = store.addBlock(ids.page, 'text', {
          id: ids.content, text: item.value, iosShareId: item.id
        });
      }

      // Even when an earlier attempt left both blocks in memory, retry the
      // pending flush. ACK only once the one blocks transaction succeeded.
      await store.flush();
      if (store.speichertNicht() ||
          store.getBlock(ids.page)?.iosShareId !== item.id ||
          store.getBlock(ids.content)?.iosShareId !== item.id) return false;

      try { app?.zeichneBaum?.(); app?.oeffne?.(page.id); } catch {}
      return true;
    })().catch(() => false).finally(() => ongoing.delete(item.id));

    ongoing.set(item.id, operation);
    return operation;
  };
  return Object.freeze({ receive });
}
