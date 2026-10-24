/*
 * Redion iOS – externe Weblinks im nativen Safari-Fenster öffnen.
 *
 * Ausschließlich aus ios/native-sicherung.ts in der iPhone-IPA importiert.
 * Die Website/PWA und Redions lokale Notizen/Dateien bleiben unangetastet.
 *
 * Nur ausdrücklich mit target="_blank" markierte HTTPS-Anker.
 * Interne Routen, Downloads, blob:, mailto:, file:, OAuth-Popups,
 * Formularnavigation und bearbeitete Inhalte bleiben beim bestehenden Code.
 */

/**
 * Pure predicate, convenient to test without an iOS device.
 * @param {MouseEvent} event
 * @param {Document} doc
 * @returns {string | null} externally browsable canonical URL
 */
export function safariTargetForClick(event, doc) {
  if (!event || event.defaultPrevented || event.button !== 0 ||
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
      !doc?.baseURI) return null;

  const clicked = event.target;
  const anchor = typeof clicked?.closest === 'function'
    ? clicked.closest('a[href][target="_blank"]') : null;
  if (!anchor || anchor.hasAttribute('download') ||
      anchor.closest('[contenteditable="true"],[contenteditable=""]')) return null;

  const raw = anchor.getAttribute('href');
  if (!raw || !raw.trim()) return null;
  let url;
  let base;
  try {
    url = new URL(raw, doc.baseURI);
    base = new URL(doc.baseURI);
  } catch {
    return null;
  }
  // HTTPS only; never pass local files, browser blobs, credentials, scripts
  // or insecure HTTP pages to the native browser bridge.
  if (url.protocol !== 'https:' || url.username || url.password ||
      url.origin === base.origin) return null;
  return url.href;
}

/**
 * @param {object} args
 * @param {Document} args.document
 * @param {{open: ({url: string}) => Promise<void>}} args.browser
 * @param {(url: string) => Promise<void>} [args.onFail]
 * @param {() => number} [args.clock]
 * @returns {() => void}
 */
export function enableIosSafariLinks({
  document: doc, browser, onFail = () => {}, clock = Date.now
}) {
  if (!doc || typeof doc.addEventListener !== 'function' ||
      typeof browser?.open !== 'function') {
    throw new TypeError('Native Safari bridge or document missing.');
  }
  let active = true;
  let lastUrl = '';
  let lastTime = -Infinity;

  const click = (event) => {
    if (!active) return;
    const url = safariTargetForClick(event, doc);
    if (!url) return;

    // We must stop WKWebView from loading external pages in the notes app.
    // Calling Browser.open directly in the trusted click keeps it a user
    // gesture and presents Apple's SFSafariViewController.
    event.preventDefault();
    const now = clock();
    if (url === lastUrl && now - lastTime < 600) return;
    lastTime = now;
    lastUrl = url;

    try {
      Promise.resolve(browser.open({ url })).catch(async () => {
        // If iOS cannot present Safari, the existing native Share sheet
        // offers a way to copy/open the link WITHOUT losing the note's view.
        await onFail(url);
      }).catch(() => {
        // Never let an external-link failure crash Redion.
      });
    } catch {
      Promise.resolve().then(() => onFail(url)).catch(() => {});
    }
  };
  doc.addEventListener('click', click);
  return () => {
    active = false;
    doc.removeEventListener('click', click);
  };
}
