// @ts-nocheck
'use strict';
/**
 * Explicit local-code preview for an installed Redion Windows app.
 * A user-selected Redion checkout is READ ONLY. Native Electron code is
 * never loaded from the checkout; only an allowlisted snapshot of web assets.
 *
 * Preview content always has a separate Chromium profile. This is not the
 * signed NSIS auto-updater, and cannot update main.cjs or the installer.
 */
const fs = require('node:fs');
const path = require('node:path');

const WEB_FOLDERS = Object.freeze(['quell', 'oeffentlich', 'fremd', 'lernpakete', 'lernen']);
const ROOT_FILES = Object.freeze(['index.html', 'sw.js', 'version.json', 'version.md']);
const CONFIG_NAME = 'lokaler-redion-ordner.json';
const MARKER_NAME = 'windows-live-stand.json';

function configurationPath(appData) {
  return path.join(appData, 'Redion', CONFIG_NAME);
}
function isSafeDirectory(directory, baseForbidden) {
  if (typeof directory !== 'string' || !path.isAbsolute(directory) ||
      directory.includes('\0') || directory.startsWith('\\\\')) return false;
  try {
    if (!fs.lstatSync(directory).isDirectory() || fs.lstatSync(directory).isSymbolicLink()) return false;
    const real = fs.realpathSync(directory);
    if (baseForbidden) {
      const forbidden = fs.realpathSync(baseForbidden);
      const relative = path.relative(forbidden, real);
      if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return false;
    }
    return true;
  } catch { return false; }
}
function configuredSource(appData) {
  try {
    const config = JSON.parse(fs.readFileSync(configurationPath(appData), 'utf8'));
    // Keep the separate profile even if the chosen folder has been moved.
    return config?.enabled === true && typeof config.directory === 'string' &&
      path.isAbsolute(config.directory) && config.directory.length < 4096 &&
      !config.directory.includes('\0') ? config.directory : null;
  } catch { return null; }
}
function saveConfiguredSource(appData, directory) {
  const file = configurationPath(appData);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (directory === null) {
    try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return;
  }
  if (!isSafeDirectory(directory, appData)) throw new Error('Kein zulässiger lokaler Projektordner.');
  validateSource(directory, appData);
  const temp = file + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify({ enabled: true, directory: fs.realpathSync(directory) }) + '\n', { mode: 0o600 });
    fs.renameSync(temp, file);
  } finally { try { fs.unlinkSync(temp); } catch {} }
}
function safeFile(filename) {
  if (!fs.lstatSync(filename).isFile() || fs.lstatSync(filename).isSymbolicLink())
    throw new Error('Webdatei ist keine gewöhnliche Datei: ' + path.basename(filename));
  // Prevent accidental inclusion of enormous archives.
  if (fs.statSync(filename).size > 100 * 1024 * 1024)
    throw new Error('Webdatei zu gross: ' + path.basename(filename));
}
function scriptRootFiles(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (!/<script\b[^>]*\bsrc="quell\/start\.js"[^>]*>/i.test(html))
    throw new Error('index.html ist kein gültiger Redion-Einstieg.');
  const result = new Set(ROOT_FILES);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/gi)) {
    const url = match[1];
    if (/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:js|css)$/.test(url))
      result.add(url);
  }
  return [...result];
}
function validateSource(root, appData) {
  if (!isSafeDirectory(root, appData)) throw new Error('Quellordner ist ungültig oder geschützt.');
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (packageJson.name !== 'redion') throw new Error('Das ist kein Redion-Projektordner.');
  for (const filename of [...scriptRootFiles(root), 'quell/start.js']) safeFile(path.join(root, filename));
  for (const folder of WEB_FOLDERS) {
    if (!fs.existsSync(path.join(root, folder))) continue;
    const stat = fs.lstatSync(path.join(root, folder));
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Ungültiger Webordner: ' + folder);
  }
  return true;
}

function copyTree(source, target) {
  if (!fs.lstatSync(source).isDirectory() || fs.lstatSync(source).isSymbolicLink())
    throw new Error('Verlinktes Webverzeichnis nicht zulässig.');
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name), to = path.join(target, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Webdatei darf keine Verknüpfung sein: ' + entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) {
      safeFile(from); fs.copyFileSync(from, to);
    } else throw new Error('Unbekannter Webdateityp: ' + entry.name);
  }
}
function snapshot(source, previewBase, revision, appData) {
  validateSource(source, appData);
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error('Ungültiger Quellstand.');
  fs.mkdirSync(previewBase, { recursive: true });
  if (fs.lstatSync(previewBase).isSymbolicLink()) throw new Error('Verknüpftes Vorschauverzeichnis.');
  const temp = path.join(previewBase, 'stand-' + revision + '.tmp');
  const ready = path.join(previewBase, 'stand-' + revision);
  if (fs.existsSync(temp) || fs.existsSync(ready)) throw new Error('Stand bereits vorhanden.');
  try {
    fs.mkdirSync(temp);
    for (const filename of scriptRootFiles(source))
      fs.copyFileSync(path.join(source, filename), path.join(temp, filename));
    for (const folder of WEB_FOLDERS) {
      const dir = path.join(source, folder);
      if (fs.existsSync(dir)) copyTree(dir, path.join(temp, folder));
    }
    safeFile(path.join(temp, 'quell/start.js'));
    // Do not mutate an active snapshot in-place: readers can finish requests.
    fs.renameSync(temp, ready);
    return ready;
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }
}
function writeMarker(markerDir, revision) {
  fs.mkdirSync(markerDir, { recursive: true });
  const file = path.join(markerDir, MARKER_NAME), temp = file + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify({ revision, status: 'ready' }));
    fs.renameSync(temp, file);
  } finally { try { fs.unlinkSync(temp); } catch {} }
}
function shouldRestage(filename) {
  // Changes to sources alone cannot be used until compiled JS is present.
  if (typeof filename !== 'string' || !filename) return true;
  const pieces = filename.replace(/\\/g, '/').split('/');
  if (pieces.some(part => !part || part.startsWith('.') || part === 'node_modules' ||
      part === 'build' || part === 'windows' || part === 'src' ||
      part === 'pruefungen' || part === 'doku')) return false;
  return WEB_FOLDERS.includes(pieces[0]) ||
    ['index.html','sw.js','version.json','version.md'].includes(filename) ||
    /^[\w-]+\.(?:js|css)$/.test(filename);
}
function startSourceUpdates({ source, previewBase, markerDir, appData, onReady,
    logger = console, debounceMs = 1400, io = fs }) {
  if (typeof onReady !== 'function') throw new Error('onReady fehlt.');
  let stopped = false, watcher = null, debounce = null;
  let revision = 0, active = null, pending = false, staging = false;
  try {
    const previous = JSON.parse(fs.readFileSync(path.join(markerDir, MARKER_NAME), 'utf8'));
    if (Number.isSafeInteger(previous.revision) && previous.revision > 0)
      revision = previous.revision;
  } catch { /* first local preview */ }
  // A crash between snapshot rename and writing the marker may leave a
  // completed stand-N without a matching marker. Never overwrite it.
  if (fs.existsSync(previewBase)) {
    for (const filename of fs.readdirSync(previewBase)) {
      const match = /^stand-(\d+)$/.exec(filename);
      if (match && Number.isSafeInteger(Number(match[1])))
        revision = Math.max(revision, Number(match[1]));
    }
  }
  // Never allow two concurrent snapshots while GitHub Desktop is updating.
  function stage() {
    if (stopped || staging) { pending = true; return; }
    staging = true;
    try {
      const next = snapshot(source, previewBase, revision + 1, appData);
      revision++;
      active = next;
      onReady(next, revision);
      writeMarker(markerDir, revision);
      // Keep the current and previous valid snapshots as a simple rollback.
      const old = revision - 2;
      if (old > 0) {
        try { fs.rmSync(path.join(previewBase, 'stand-' + old), { recursive: true, force: true }); }
        catch (error) { logger.warn('Alter Quellstand nicht bereinigt:', String(error)); }
      }
    } catch (error) {
      logger.warn('Redion-Ordner noch nicht vollständig; bisheriger Stand bleibt:', String(error));
    } finally {
      staging = false;
      if (pending && !stopped) { pending = false; queue(); }
    }
  }
  function queue() {
    if (stopped) return;
    clearTimeout(debounce);
    debounce = setTimeout(stage, debounceMs);
    debounce.unref?.();
  }
  // Remove an abandoned .tmp from a previous interrupted Git checkout.
  // Only our dedicated preview cache is touched, never the source or notes.
  if (fs.existsSync(previewBase)) {
    for (const name of fs.readdirSync(previewBase)) {
      if (/^stand-\d+\.tmp$/.test(name))
        fs.rmSync(path.join(previewBase, name), { recursive: true, force: true });
    }
  }
  // An initial snapshot is required before the first load of the renderer.
  stage();
  if (!active) throw new Error('Lokale Redion-Dateien konnten nicht sicher vorbereitet werden.');
  try {
    watcher = io.watch(source, { recursive: true }, (_event, filename) => {
      if (shouldRestage(filename?.toString())) queue();
    });
    watcher.on?.('error', error => logger.warn('Ordnerbeobachtung unterbrochen:', String(error)));
  } catch (error) {
    logger.warn('Automatische Ordnerbeobachtung nicht verfügbar:', String(error));
  }
  return {
    get active() { return active; },
    get revision() { return revision; },
    stop() { stopped = true; if (debounce) clearTimeout(debounce); watcher?.close(); }
  };
}
module.exports = {
  configurationPath, configuredSource, saveConfiguredSource, validateSource,
  scriptRootFiles, snapshot, shouldRestage, startSourceUpdates
};
