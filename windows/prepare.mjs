/*
 * Desktop-only, read-only stage of the EXACT same built Redion interface
 * that Codemagic copies for Capacitor. No native iOS code is injected.
 * No user's data or installation directory is ever touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareWindowsWeb } from './compare-web.mts';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const target = path.join(root, 'build/windows-app');
const appFolders = ['quell','oeffentlich','fremd','lernpakete','lernen'];

export function prepareWindowsApp(from = root, to = target) {
  if (path.resolve(to) !== target || path.resolve(from) !== root) {
    throw new Error('Windows-Assets dürfen nur in build/windows-app erzeugt werden.');
  }
  for (const filename of ['index.html', 'sw.js', 'quell/start.js']) {
    if (!fs.statSync(path.join(root, filename)).isFile()) {
      throw new Error('Redion-Web-Build fehlt: ' + filename);
    }
  }
  fs.mkdirSync(target, { recursive: true });
  for (const filename of ['index.html','sw.js']) {
    fs.copyFileSync(path.join(root, filename), path.join(target, filename));
  }
  for (const folder of appFolders) {
    const source = path.join(root, folder);
    if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
      fs.cpSync(source, path.join(target, folder), { recursive: true, force: true });
    }
  }
  const html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
  if (!html.includes('quell/start.js') || html.includes('redion-native-sicherung.js')) {
    throw new Error('Falsche Web- oder iOS-Vorlage im Windows-Build.');
  }
  // Lieber abbrechen als alte Dateien aus einem früheren Branch ausliefern.
  compareWindowsWeb(root, target);
  console.log('Redion Windows: identische Weboberfläche offline paketiert.');
  return target;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { prepareWindowsApp(); } catch (error) {
    console.error('Windows-Vorbereitung fehlgeschlagen:', error.message);
    process.exitCode = 1;
  }
}
