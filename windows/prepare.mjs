/*
 * Desktop-only, read-only stage of the EXACT same built Redion interface
 * that Codemagic copies for Capacitor. No native iOS code is injected.
 * No user's data or installation directory is ever touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareWindowsWeb, expectedWebFiles } from './compare-web.mts';
import { webFolders, webRootFiles } from './web-files.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const target = path.join(root, 'build/windows-app');


export function prepareWindowsApp(from = root, to = target) {
  if (path.resolve(to) !== target || path.resolve(from) !== root) {
    throw new Error('Windows-Assets dürfen nur in build/windows-app erzeugt werden.');
  }
  for (const filename of ['index.html', 'sw.js', 'quell/start.js']) {
    if (!fs.statSync(path.join(root, filename)).isFile()) {
      throw new Error('Redion-Web-Build fehlt: ' + filename);
    }
  }
  // Never follow a symlink if a damaged or hostile build folder is present.
  if (fs.existsSync(target) && (!fs.lstatSync(target).isDirectory() ||
      fs.lstatSync(target).isSymbolicLink())) {
    throw new Error('Windows-Bauordner ist kein echtes Verzeichnis.');
  }
  fs.mkdirSync(target, { recursive: true });
  for (const filename of webRootFiles(root)) {
    fs.copyFileSync(path.join(root, filename), path.join(target, filename));
  }
  for (const folder of webFolders) {
    const source = path.join(root, folder);
    if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
      fs.cpSync(source, path.join(target, folder), { recursive: true, force: true });
    }
  }
  // Also handle deleted source files: an old asset must not survive inside
  // the Windows app from a previous branch or development build. Only the
  // dedicated build/windows-app staging tree is touched.
  const allowed = new Set(expectedWebFiles(root));
  const prune = (directory, prefix = '') => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const name = prefix ? prefix + '/' + entry.name : entry.name;
      const full = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symlink im Windows-Webpaket: ' + name);
      if (entry.isDirectory()) {
        prune(full, name);
        if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
      } else if (entry.isFile() && !allowed.has(name)) {
        fs.unlinkSync(full);
      } else if (!entry.isFile()) {
        throw new Error('Ungültiger Dateityp im Windows-Webpaket: ' + name);
      }
    }
  };
  prune(target);
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
