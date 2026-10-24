/*
 * Redion iOS – nativer Export für die bestehende .redion/.json-Sicherung.
 * Nur in der Capacitor-iOS-App gebündelt. Die Browser-/PWA-Version bleibt
 * unberührt und verwendet weiterhin ihren bisherigen Download.
 *
 * Eine lokale Kopie liegt unter Auf meinem iPhone > Redion > Backups.
 * Das Share Sheet bietet zusätzlich "In Dateien sichern" (iCloud Drive usw.).
 * Weder ersetzt dies das IndexedDB-Modell, noch sind externe Backups automatisch.
 */
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { basis64Scheiben } from './backup-chunks.mjs';

async function speichern(blob: Blob, name: string): Promise<{ datei: string; teilDialog: boolean }> {
  if (!(blob instanceof Blob) || blob.size <= 0) {
    throw new Error('Die Sicherung ist leer – keine Datei angelegt.');
  }
  if (!/^redion-sicherung-\d{4}-\d{2}-\d{2}\.(json|redion)$/.test(name)) {
    throw new Error('Unerwarteter Sicherungsname.');
  }

  const punkt = name.lastIndexOf('.');
  const eindeutig = name.slice(0, punkt) + '-' +
    new Date().toISOString().slice(11, 19).replace(/:/g, '-') + '-' +
    crypto.randomUUID().slice(0, 8) + name.slice(punkt);

  const ordner = 'Backups';
  const ziel = ordner + '/' + eindeutig;
  const teil = ordner + '/.' + eindeutig + '.teil';
  const directory = Directory.Documents;
  await Filesystem.mkdir({path: ordner, directory, recursive: true});

  let angelegt = false;
  try {
    await Filesystem.writeFile({path: teil, directory, data: ''});
    angelegt = true;
    for await (const daten of basis64Scheiben(blob)) {
      await Filesystem.appendFile({path: teil, directory, data: daten});
    }
    const stand = await Filesystem.stat({path: teil, directory});
    if (Number(stand.size) !== blob.size) {
      throw new Error('Sicherung unvollständig: ' + stand.size + ' von ' + blob.size + ' Byte.');
    }
    await Filesystem.rename({from: teil, to: ziel, directory, toDirectory: directory});
    angelegt = false;
  } catch (fehler) {
    if (angelegt) {
      try { await Filesystem.deleteFile({path: teil, directory}); } catch { /* Teil nicht behalten */ }
    }
    throw fehler;
  }

  let teilDialog = false;
  try {
    const {uri} = await Filesystem.getUri({path: ziel, directory});
    await Share.share({
      title: 'Redion-Sicherung',
      text: 'Bitte eine weitere Kopie ausserhalb von Redion speichern.',
      url: uri,
      dialogTitle: 'Redion-Sicherung teilen oder in Dateien sichern'
    });
    teilDialog = true;
  } catch {
    /* Die geprüfte Kopie liegt weiter unter Backups im Dokumentenordner.
       Wenn Teilen abgebrochen/nicht verfügbar ist, kein Verlust der Kopie. */
  }
  return {datei: ziel, teilDialog};
}

if (Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform()) {
  (globalThis as any).RedionNativeSicherung = Object.freeze({speichern});
}
