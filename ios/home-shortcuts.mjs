/*
 * Redion iOS: Quick Actions on the home-screen app icon.
 *
 * Exclusively loaded through ios/native-sicherung.ts in the native IPA.
 * Route via the existing mobile dock click handlers, never duplicate
 * navigation/business logic. No storage, app state writes or network calls.
 */
export const SHORTCUT_TABS = Object.freeze({
  neu: 'btn-new-bottom',
  dokumente: 'hl-dok',
  heute: 'hl-start',
  lernen: 'hl-lernen'
});

export function createHomeShortcutRouter({
  document: doc,
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancel = id => clearTimeout(id),
  now = Date.now,
  maxRetries = 65
}) {
  if (!doc || typeof doc.getElementById !== 'function') {
    throw new TypeError('Redion-Dokument für die iOS-Schnellaktionen fehlt.');
  }
  let active = true;
  let pending = null;
  let timer = null;
  let attempts = 0;
  let lastAction = null;
  let lastTime = -Infinity;

  const retry = () => {
    if (!active || pending === null) return;
    // Let start.js finish attaching the existing button handlers.
    // Loading or hidden views are not ready for external navigation.
    const button = doc.getElementById(SHORTCUT_TABS[pending]);
    if (doc.readyState === 'complete' && !doc.hidden &&
        button?.isConnected && !button.disabled &&
        attempts > 1) {
      const action = pending;
      pending = null;
      timer = null;
      button.click();
      lastAction = action;
      lastTime = now();
      return;
    }
    if (attempts++ >= maxRetries) {
      pending = null;
      timer = null;
      return;
    }
    timer = schedule(retry, 200);
  };

  return Object.freeze({
    receive(action) {
      if (!active || typeof action !== 'string' ||
          !Object.hasOwn(SHORTCUT_TABS, action)) return false;
      // iOS can repeat the same launch callback on activation. One action
      // should produce at most one navigation in any half-second interval.
      if (action === lastAction && now() - lastTime < 500) return true;
      if (pending === action) return true;
      pending = action;
      attempts = 0;
      if (timer !== null) cancel(timer);
      timer = schedule(retry, 200);
      return true;
    },
    stop() {
      active = false;
      pending = null;
      if (timer !== null) cancel(timer);
      timer = null;
    }
  });
}
