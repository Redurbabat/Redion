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
import { createNativeFileExporter } from './native-file-export.mjs';
import { startIosNativeFeel } from './native-feel.mjs';

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
}
