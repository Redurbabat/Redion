/*
 * Redion iOS – native Sicherungen und Dateiexporte.
 *
 * Die Website und PWA laden diese Datei niemals: Codemagic buendelt sie
 * ausschliesslich in das iOS-www. Der Inhalt der Web-App bleibt gleich.
 *
 * Im App-Container:
 *   Dateien → Auf meinem iPhone → Redion → Backups   (.json/.redion)
 *   Dateien → Auf meinem iPhone → Redion → Exporte   (PDF, Fotos usw.)
 *
 * Die Share Sheet bietet eine zweite Kopie ausserhalb der App an.
 * Eine Kopie in diesem Container wird beim Deinstallieren geloescht!
 */
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Haptics } from '@capacitor/haptics';
import { Browser } from '@capacitor/browser';
import { createNativeFileExporter } from './native-file-export.mjs';
import { withNativeExportFeedback } from './native-export-feedback.mjs';
import { startIosNativeFeel } from './native-feel.mjs';
import { installIosNativeLayout } from './native-layout.mjs';
import { createHomeShortcutRouter } from './home-shortcuts.mjs';
import { enableIosSafariLinks } from './native-safari-links.mjs';
import { createIosShareInbox } from './incoming-share.mjs';
import { createIosShareReadiness } from './incoming-share-readiness.mjs';
import { createNativeDocumentInbox } from './native-documents.mts';

// The same global lexical store used by Redion's classic browser scripts.
// A Share Extension never sees these objects; only the foreground host does.
declare const Store: any;
declare const App: any;
declare const Ereignisse: any;
declare const DeviceIntegration: any;

const saveFile = withNativeExportFeedback(createNativeFileExporter({
  filesystem: Filesystem,
  share: Share,
  directory: Directory.Documents,
  createId: () => crypto.randomUUID(),
  now: () => new Date()
}), {
  haptics: Haptics,
  document,
  quiet: () => document.body?.dataset?.bewegung === 'ruhig'
});

async function saveBackup(blob: Blob, name: string) {
  if (!/^redion-sicherung-\d{4}-\d{2}-\d{2}\.(json|redion)$/.test(name)) {
    throw new Error('Unerwarteter Sicherungsname.');
  }
  return saveFile(blob, name, 'Backups');
}

async function exportAttachment(blob: Blob, name: string) {
  return saveFile(blob, name, 'Exporte');
}

if (Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform()) {
  (globalThis as any).RedionNativeSicherung = Object.freeze({ speichern: saveBackup });
  (globalThis as any).RedionNativeDateien = Object.freeze({ speichern: exportAttachment });

  // The web/PWA never loads this module. Do not alter Redion's routes,
  // TabShelf gestures, documents or CSS: only tell native UIKit when
  // touch selection and the existing theme change.
  const prepare = () => {
    installIosNativeLayout(document);
    return startIosNativeFeel({
    document,
    haptics: Haptics,
    bars: SystemBars,
    styles: SystemBarsStyle,
    statusBar: SystemBarType.StatusBar,
    quiet: () => document.body?.dataset?.bewegung === 'ruhig'
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepare, { once: true });
  } else {
    prepare();
  }

  // Native iOS Home Screen Quick Actions (long-press app icon) use the
  // EXISTING Redion tab click handlers. This global is defined only in
  // the iOS IPA, never on the browser/PWA website.
  (globalThis as any).RedionNativeShortcut =
    createHomeShortcutRouter({ document });

  // When iOS returns from another app's Share Sheet, accept the App
  // Group item only after the ordinary Redion store has saved it. The
  // extension's JSON file stays on disk if Redion is not ready or fails.
  const readiness = createIosShareReadiness({
    // The native bridge is inserted before </body>; Redion's regular
    // scripts are deferred. Look up Ereignisse only during delivery,
    // NEVER while the native module itself is evaluated.
    events: () => typeof Ereignisse !== 'undefined'
      ? Ereignisse : (globalThis as any).Ereignisse,
    // This is the exact value of ARTEN.ablageGeladen in Redion's bus.
    // Avoid early access to a deferred global lexical constant.
    eventName: 'ablage.geladen',
    document
  });
  let incoming: ReturnType<typeof createIosShareInbox> | null = null;
  (globalThis as any).RedionNativeDocuments = createNativeDocumentInbox({
    filesystem: Filesystem, directory: Directory.Documents,
    ready: () => readiness.ready() && typeof DeviceIntegration !== 'undefined',
    importFile: (file: File) => DeviceIntegration.importFile(file),
    onError: (error: unknown) => alert('Datei nicht übernommen. Das Original und die native Arbeitskopie bleiben erhalten. ' +
      (error instanceof Error ? error.message : String(error)))
  });
  (globalThis as any).RedionNativeShare = Object.freeze({
    receive(raw: unknown): Promise<boolean> {
      const store = typeof Store !== 'undefined' ? Store : (globalThis as any).Store;
      // The classic Store is available before its async IndexedDB load.
      // Never create a page in an uninitialized/locked-out local cache.
      if (!readiness.ready() || !store?.cache ||
          typeof store.flush !== 'function' ||
          typeof store.getBlock !== 'function' ||
          typeof store.updateBlock !== 'function' ||
          typeof store.speichertNicht !== 'function') return Promise.resolve(false);
      if (!incoming) incoming = createIosShareInbox({
        store,
        app: typeof App !== 'undefined' ? App : (globalThis as any).App,
        document
      });
      return incoming.receive(raw);
    }
  });

  // An external HTTPS web link should not replace the local-first notes
  // view. Apple SFSafariViewController has a native Done button to return.
  // A failed browser presentation falls back to the existing native Share
  // sheet so the original Redion document stays in place.
  enableIosSafariLinks({
    document,
    browser: Browser,
    onFail: (url: string) => Share.share({ title: 'Weblink öffnen', url })
  });
}
