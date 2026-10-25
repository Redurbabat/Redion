/*
 * Native-only readiness gate. The global Store object is constructed before
 * its asynchronous IndexedDB load; its mere existence means NOTHING.
 * Redion's event bus replays 'ablage.geladen' to late subscribers.
 *
 * If the database never loads, keep App Group JSON safely on disk.
 */
export function createIosShareReadiness({ events, eventName = 'ablage.geladen' } = {}) {
  let loaded = false;
  if (events && typeof events.horche === 'function') {
    try {
      events.horche(eventName, () => { loaded = true; }, { nachreichen: true });
    } catch {
      // No guessed fallback. Native delivery retries on next foreground.
    }
  }
  return Object.freeze({ ready: () => loaded });
}
