'use strict';
/*
 * Redion for Windows. A real offline desktop process with a native window,
 * Start-menu entry and installer. The renderer uses the existing Redion UI.
 * No Node APIs reach notes or the editor; all app files are read-only.
 */
const { app, BrowserWindow, Menu, protocol, net, shell, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveBundledAsset } = require('./paths.cjs');
const { startRedionAutoUpdates } = require('./auto-update.cjs');

const SCHEME = 'redion-local';
const START_URL = 'redion-local://app/index.html';
const APP_ID = 'ch.redurbabat.redion.windows';

protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, allowServiceWorkers: true, stream: true }
}]);

// Stable profile is critical: Chromium IndexedDB lives here across updates.
// Never remove this folder, rename it based on release versions, or run the
// app with a temporary session.
app.setName('Redion');
app.setPath('userData', path.join(app.getPath('appData'), 'Redion'));
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  let mainWindow = null;

  const isInternal = (raw) => {
    try {
      const u = new URL(raw);
      return u.protocol === SCHEME + ':' && u.host === 'app' &&
        !u.username && !u.password && !u.port;
    } catch { return false; }
  };

  const openExternal = (raw) => {
    try {
      const u = new URL(raw);
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        void shell.openExternal(raw);
      }
    } catch {}
  };

  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  function appMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Datei', submenu: [{ role: 'quit', label: 'Redion beenden' }] },
      { label: 'Bearbeiten', submenu: [
        { role: 'undo', label: 'Rückgängig' },
        { role: 'redo', label: 'Wiederholen' },
        { type: 'separator' },
        { role: 'cut', label: 'Ausschneiden' },
        { role: 'copy', label: 'Kopieren' },
        { role: 'paste', label: 'Einfügen' },
        { role: 'selectAll', label: 'Alles auswählen' }
      ] },
      { label: 'Ansicht', submenu: [
        { role: 'reload', label: 'Neu laden' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Originalgröße' },
        { role: 'zoomIn', label: 'Vergrößern' },
        { role: 'zoomOut', label: 'Verkleinern' },
        { role: 'togglefullscreen', label: 'Vollbild' }
      ] }
    ]));
  }

  function launchWindow() {
    const assets = app.isPackaged
      ? path.join(process.resourcesPath, 'redion-web')
      : path.resolve(__dirname, '../build/windows-app');

    // File URLs are not the document origin. Chromium gets a proper secure,
    // standard origin for IndexedDB and relative CSS/JS assets instead.
    protocol.handle(SCHEME, request => {
      const file = resolveBundledAsset(assets, request.url);
      if (!file) return new Response('Nicht gefunden', { status: 404 });
      return net.fetch(pathToFileURL(file).href);
    });

    const icon = path.join(assets, 'oeffentlich/icons/icon-512.png');
    mainWindow = new BrowserWindow({
      title: 'Redion',
      width: 1300,
      height: 860,
      minWidth: 860,
      minHeight: 580,
      backgroundColor: '#191a1e',
      autoHideMenuBar: false,
      show: false,
      icon,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        webviewTag: false
      }
    });

    // Imported notes and external links must not navigate the privileged
    // desktop window or gain Electron/Node privileges.
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (isInternal(url)) return;
      event.preventDefault();
      openExternal(url);
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      openExternal(url);
      return { action: 'deny' };
    });
    mainWindow.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
      callback(false);
    });
    mainWindow.once('ready-to-show', () => mainWindow?.show());
    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.loadURL(START_URL).catch(error => {
      dialog.showErrorBox('Redion konnte nicht starten', String(error));
    });
  }

  app.whenReady().then(() => {
    appMenu();
    launchWindow();
    // Silent background checks ONLY in a signed NSIS release with a verified
    // HTTPS feed. An ordinary local/unsigned build remains fully offline.
    startRedionAutoUpdates({
      app,
      updater: require('electron-updater').autoUpdater,
      yaml: require('js-yaml')
    });
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) launchWindow();
    });
  });
  app.on('window-all-closed', () => app.quit());
}
