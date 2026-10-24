/*
 * Redion – native iOS-Dateien aus demselben Web-Datenbestand exportieren.
 * Reiner, testbarer Ablauf ohne direkte Capacitor-Abhaengigkeiten.
 * Nur im iOS-Build gebuendelt, nicht in der Webversion geladen.
 */
import { basis64Scheiben } from './backup-chunks.mjs';

/** Niemals einen uebernommenen Dateinamen als Pfad verwenden. */
export function safeFileName(input) {
  const last = String(input ?? '').normalize('NFC').split(/[\\/]/).at(-1) ?? '';
  const clean = last
    .replace(/[\u0000-\u001f\u007f<>:"|?*\u202a-\u202e\u2066-\u2069]/g, '-')
    .replace(/^\.+/, '')
    .replace(/[.\s]+$/, '')
    .trim();
  if (!clean) return 'Datei';
  if (clean.length <= 150) return clean;
  const dot = clean.lastIndexOf('.');
  const extension = dot > 0 && clean.length - dot <= 12 ? clean.slice(dot) : '';
  return clean.slice(0, 150 - extension.length) + extension;
}

/**
 * Ein in die iOS-Dateien-App sichtbares Dokument schreiben.
 * Die Binaerdaten gehen in begrenzten Base64-Scheiben ueber die Bridge.
 * Die Dateigroesse wird nachgerechnet, die .teil-Datei erst danach umbenannt.
 * Ein abgebrochenes Share Sheet aendert NICHT den bereits gespeicherten Export.
 */
export function createNativeFileExporter({ filesystem, share, directory, createId, now }) {
  if (!filesystem || !share || !directory || !createId || !now) {
    throw new TypeError('Native Dateiausgabe ist nicht konfiguriert.');
  }

  return async function saveFile(blob, originalName, folder = 'Exporte') {
    if (!(blob instanceof Blob) || blob.size <= 0) {
      throw new Error('Die Datei ist leer und wurde nicht exportiert.');
    }
    if (folder !== 'Exporte' && folder !== 'Backups') {
      throw new Error('Unbekannter Zielordner.');
    }
    const name = safeFileName(originalName);
    const dot = name.lastIndexOf('.');
    const extension = dot > 0 ? name.slice(dot) : '';
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const timestamp = now().toISOString().replace(/[:.]/g, '-');
    const id = String(createId()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    if (id.length < 8) throw new Error('Die Dateikennung ist ungueltig.');
    const filename = stem + '-' + timestamp + '-' + id + extension;
    const target = folder + '/' + filename;
    const partial = folder + '/.' + filename + '.teil';

    await filesystem.mkdir({ path: folder, directory, recursive: true });
    let hasPartial = false;
    try {
      await filesystem.writeFile({ path: partial, directory, data: '' });
      hasPartial = true;
      for await (const data of basis64Scheiben(blob)) {
        await filesystem.appendFile({ path: partial, directory, data });
      }
      const stat = await filesystem.stat({ path: partial, directory });
      if (Number(stat.size) !== blob.size) {
        throw new Error('Datei unvollstaendig: ' + stat.size + ' von ' + blob.size + ' Byte.');
      }
      await filesystem.rename({ from: partial, to: target, directory, toDirectory: directory });
      hasPartial = false;
    } catch (error) {
      if (hasPartial) {
        try { await filesystem.deleteFile({ path: partial, directory }); }
        catch { /* Das Original wurde niemals angefasst. */ }
      }
      throw error;
    }

    let shareSheetOpened = false;
    try {
      const { uri } = await filesystem.getUri({ path: target, directory });
      // 'files' statt 'url': iOS soll eine echte Datei mit Dateiendung teilen.
      await share.share({ title: 'Redion – ' + name, files: [uri] });
      shareSheetOpened = true;
    } catch {
      // Nutzer hat abgebrochen oder iOS konnte das Teilen-Menue nicht oeffnen.
      // Die Datei bleibt unter „Auf meinem iPhone → Redion“ gespeichert.
    }
    return { path: target, bytes: blob.size, shareSheetOpened };
  };
}
