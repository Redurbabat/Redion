// @ts-nocheck
'use strict';
/* Development only: staged build marker -> safe reload of the SAME window.
 * No access to the editor filesystem, and never run in packaged releases.
 * The Renderer still runs sandboxed without Node or arbitrary IPC. */
const fs = require('node:fs');
const path = require('node:path');

const MARKER = 'windows-live-stand.json';
function readRevision(buildDir, io = fs) {
  try {
    const stamp = JSON.parse(io.readFileSync(path.join(buildDir, MARKER), 'utf8'));
    return stamp.status === 'ready' && Number.isSafeInteger(stamp.revision) &&
      stamp.revision > 0 ? stamp.revision : null;
  } catch { return null; }
}

const TRACK_INTERACTION = [
  '(() => {',
  'if (window.__redionLiveTracking) return;',
  'window.__redionLiveTracking = true;',
  'window.__redionLiveLastInput = 0;',
  "for (const name of ['input', 'keydown', 'pointerdown', 'pointerup', 'compositionend']) {",
  '  window.addEventListener(name, () => { window.__redionLiveLastInput = Date.now(); }, true);',
  '}',
  '})()'
].join('\n');

// Deliberately only execute this fixed code in the main app frame, never
// accept renderer-supplied code/paths. A pending edit is persisted before
// reloading. Dialogs stay untouched until closed.
const SAFE_TO_RELOAD = [
  '(async () => {',
  "if (document.readyState !== 'complete') return false;",
  'if (Date.now() - (window.__redionLiveLastInput || 0) < 2200) return false;',
  'if (document.querySelector(\'.overlay, dialog[open], [role="dialog"][aria-modal="true"]\')) return false;',
  "if (typeof Store !== 'undefined' && typeof Store.flush === 'function') await Store.flush();",
  'return true;',
  '})()'
].join('\n');

function startLiveReload({ buildDir, window, io = fs, timer = setTimeout, clear = clearTimeout,
    logger = console }) {
  if (!window || !window.webContents || !buildDir) throw new Error('Live-Reload braucht ein Fenster.');
  const contents = window.webContents;
  let finished = false, timeout = null, inFlight = false;
  let revision = readRevision(buildDir, io) || 0;
  let pending = revision;
  let watcher = null;
  const isAvailable = () => !contents.isDestroyed() && !window.isDestroyed();
  const track = () => {
    if (!finished && isAvailable())
      void contents.executeJavaScript(TRACK_INTERACTION).catch(() => {});
  };
  contents.on('did-finish-load', track);
  function schedule(ms = 500) {
    if (finished || timeout !== null) return;
    timeout = timer(() => {
      timeout = null;
      void attempt();
    }, ms);
  }
  async function attempt() {
    if (finished || inFlight || pending <= revision) return;
    if (!isAvailable() || contents.isLoading()) { schedule(1200); return; }
    inFlight = true;
    try {
      const safe = await contents.executeJavaScript(SAFE_TO_RELOAD);
      if (!safe) { schedule(1200); return; }
      revision = pending;
      logger.info('[Redion-Live] Webansicht aktualisieren:', revision);
      contents.reloadIgnoringCache();
    } catch (error) {
      logger.warn('[Redion-Live] Noch nicht neu geladen:', String(error));
      schedule(1500);
    } finally { inFlight = false; }
  }
  try {
    watcher = io.watch(buildDir, (_event, name) => {
      if (name && String(name) !== MARKER) return;
      const next = readRevision(buildDir, io);
      if (next !== null && next > pending) {
        pending = next;
        schedule();
      }
    });
  } catch (error) {
    logger.warn('[Redion-Live] Aktualisierungsbeobachtung nicht verfügbar:', String(error));
  }
  track();
  return {
    stop() {
      finished = true;
      watcher?.close();
      if (timeout !== null) clear(timeout);
      contents.removeListener('did-finish-load', track);
    }
  };
}
module.exports = { startLiveReload, readRevision };
