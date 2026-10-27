/*
 * Native-only Share Sheet readiness. Redion's classic application scripts
 * use "defer"; the injected native bridge can run BEFORE the event bus even
 * exists. Bind on demand, and retry instead of permanently subscribing to
 * null at module evaluation time.
 *
 * Store.load() emits a replayable 'ablage.geladen' event, but the password
 * lock and app startup continue AFTER that event. Don't import over them.
 * A failed startup leaves the native App Group inbox untouched.
 */
export function createIosShareReadiness({
  events,
  eventName = 'ablage.geladen',
  document: doc
} = {}) {
  let loaded = false;
  let subscribed = false;

  const attach = () => {
    if (subscribed) return;
    try {
      const bus = typeof events === 'function' ? events() : events;
      if (!bus || typeof bus.horche !== 'function') return;
      bus.horche(eventName, () => { loaded = true; }, { nachreichen: true });
      subscribed = true;
    } catch {
      // Defer/TDZ, unavailable bus or an incomplete startup: fail closed.
      // The next native delivery attempts binding again.
    }
  };

  const interfaceReady = () => {
    if (!doc) return true; // Simplifies pure event-bus contract tests.
    if (doc.hidden || doc.readyState === 'loading') return false;
    if (doc.getElementById?.('sperrschirm')) return false;
    const splash = doc.getElementById?.('ru-vorhang');
    if (splash && !splash.hidden &&
        !splash.classList?.contains('ru-vorhang-weg')) return false;
    return true;
  };

  return Object.freeze({
    ready() {
      attach();
      return loaded && interfaceReady();
    }
  });
}
