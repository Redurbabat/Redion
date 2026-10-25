/*
 * Redion iOS – a subtle confirmation after the native Files export resolves.
 * The shared web application and its storage model remain untouched.
 * Saving must never depend on haptics, and a failed write must not pulse.
 */

/**
 * @param {(blob: Blob, name: string, folder?: string) => Promise<unknown>} save
 * @param {{ haptics: { impact: ({style: string}) => Promise<void> },
 *   document: Document, quiet?: () => boolean }} options
 */
export function withNativeExportFeedback(save, {
  haptics,
  document: doc,
  quiet = () => false
}) {
  if (typeof save !== 'function') throw new TypeError('Native save callback missing.');

  return async function saveWithFeedback(...args) {
    // A resolved native exporter confirms that the bytes reached Files;
    // the Share sheet itself does not confirm an external cloud copy.
    const result = await save(...args);
    try {
      const reducedMotion = doc?.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      )?.matches === true;
      if (!doc?.hidden && !quiet() && !reducedMotion &&
          typeof haptics?.impact === 'function') {
        // Fire-and-forget: UIKit must never delay successful delivery of
        // the stored-file result or change the export's return value.
        Promise.resolve().then(() => haptics.impact({ style: 'LIGHT' })).catch(() => {});
      }
    } catch {
      // Optional sensory feedback may fail; actual file persistence did not.
    }
    return result;
  };
}
