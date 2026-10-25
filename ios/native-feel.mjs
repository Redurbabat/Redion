/*
 * Redion – iOS-only native UI polish.
 * This module is imported exclusively by ios/native-sicherung.ts and bundled
 * into www/redion-native-sicherung.js after the strict web-parity check.
 *
 * No modification to shared website JS/CSS, user data or the TabShelf
 * selection algorithm. Every native call is best-effort; a failing
 * haptics/status-bar plugin must never block normal navigation.
 */

/**
 * @param {object} options
 * @param {Document} options.document
 * @param {{impact: (options: {style: string}) => Promise<void>}} options.haptics
 * @param {{setStyle: (options: {style: string}) => Promise<void>}} options.bars
 * @param {{Dark: string, Light: string}} options.styles
 * @param {string} options.statusBar Capacitor SystemBarType.StatusBar
 * @param {() => number} [options.clock]
 * @param {typeof MutationObserver} [options.Observer]
 * @param {() => boolean} [options.quiet]
 * @returns {() => void} unsubscribe (for tests or app cleanup)
 */
export function startIosNativeFeel({
  document: doc,
  haptics,
  bars,
  styles,
  statusBar,
  clock = Date.now,
  Observer = MutationObserver,
  quiet = () => false
}) {
  if (!doc?.documentElement || !doc?.body ||
      typeof haptics?.impact !== 'function' ||
      typeof bars?.setStyle !== 'function' ||
      typeof statusBar !== 'string' || !statusBar) {
    throw new TypeError('Native UI bridge is incomplete.');
  }

  let ended = false;
  let lastHaptic = -Infinity;
  let appliedStyle = null;
  let generation = 0;
  let pending = Promise.resolve();
  const html = doc.documentElement;

  // "Dark" means LIGHT system bar symbols over a dark background in
  // Capacitor 8 SystemBars; "Light" means DARK symbols on light.
  // Redion changes html[data-theme] on every theme switch.
  const syncBars = (force = false) => {
    // WKWebView can regain the foreground with a reset UIKit bar style even
    // though html[data-theme] has not changed. Reapply after app activation.
    if (ended || doc.hidden) return;
    const desired = html.dataset?.theme === 'light' ? styles.Light : styles.Dark;
    if (!force && desired === appliedStyle) return;
    appliedStyle = desired;
    const request = ++generation;
    // Serialize native calls, but discard superseded calls still in the
    // queue. UIKit can be slow to resume, while WebKit can switch themes or
    // return from the app switcher multiple times in the same event loop.
    pending = pending.catch(() => {}).then(async () => {
      // Do not touch the status bar while the app is backgrounded. Reapply
      // on visibilitychange/pageshow/focus after WebKit becomes visible.
      if (ended || doc.hidden || request !== generation) return;
      await bars.setStyle({ style: desired, bar: statusBar });
    }).catch(() => {
      // Only the latest failed request may invalidate the style cache:
      // an older rejected bridge call must not erase a newer request.
      if (request === generation && appliedStyle === desired) appliedStyle = null;
    });
  };

  const feedback = () => {
    if (ended || quiet() || doc.hidden ||
        doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const now = clock();
    // One subtle tap, at most every 140ms, and never an audible UI effect.
    if (now - lastHaptic < 140) return;
    lastHaptic = now;
    Promise.resolve().then(() => haptics.impact({ style: 'LIGHT' })).catch(() => {});
  };

  const onClick = (event) => {
    // Only touch/mouse activation (not simulated keyboard Enter/Space).
    if (event.detail === 0) return;
    const target = event.target;
    if (typeof target?.closest !== 'function') return;
    const button = target.closest(
      '#handy-oben > button[role="tab"], ' +
      '#ho-ziele > button[role="menuitem"], ' +
      '.document-workspace [data-document-action="previous"], ' +
      '.document-workspace [data-document-action="next"], ' +
      '.document-workspace [data-document-action="page-jump"]'
    );
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    feedback();
  };

  const onGestureSelection = (changes) => {
    // TabShelf's existing "slide across 5 destinations" may select by
    // pointerup rather than click; observe its marker but NEVER navigate.
    for (const change of changes) {
      const target = change.target;
      if (change.attributeName === 'data-anvisiert' &&
          target?.parentElement?.id === 'ho-ziele' &&
          target.hasAttribute('data-anvisiert')) {
        feedback();
        break;
      }
    }
  };

  const onResume = () => {
    // Capacitor's web view emits standard page/visibility lifecycle events;
    // no new plugin and no changes to the shared Redion UI are required.
    if (!doc.hidden) syncBars(true);
  };

  const themeObserver = new Observer(() => syncBars());
  const gestureObserver = new Observer(onGestureSelection);
  themeObserver.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  gestureObserver.observe(doc.body, {
    attributes: true, subtree: true, attributeFilter: ['data-anvisiert']
  });
  doc.addEventListener('click', onClick, { passive: true });
  doc.addEventListener('visibilitychange', onResume);
  doc.defaultView?.addEventListener?.('pageshow', onResume);
  doc.defaultView?.addEventListener?.('focus', onResume);
  syncBars();

  return () => {
    ended = true;
    themeObserver.disconnect();
    gestureObserver.disconnect();
    doc.removeEventListener('click', onClick);
    doc.removeEventListener('visibilitychange', onResume);
    doc.defaultView?.removeEventListener?.('pageshow', onResume);
    doc.defaultView?.removeEventListener?.('focus', onResume);
  };
}
