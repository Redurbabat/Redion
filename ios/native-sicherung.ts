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
import { startIosNativeFeel } from './native-feel.mjs';
import { createHomeShortcutRouter } from './home-shortcuts.mjs';
import { enableIosSafariLinks } from './native-safari-links.mjs';

const saveFile = createNativeFileExporter({
  filesystem: Filesystem,
  share: Share,
  directory: Directory.Documents,
  createId: () => crypto.randomUUID(),
  now: () => new Date()
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
  const prepare = () => startIosNativeFeel({
    document,
    haptics: Haptics,
    bars: SystemBars,
    styles: SystemBarsStyle,
    statusBar: SystemBarType.StatusBar,
    quiet: () => document.body?.dataset?.bewegung === 'ruhig'
  });
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
