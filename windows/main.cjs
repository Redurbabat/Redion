'use strict';
/*
 * Redion for Windows. A real offline desktop process with a native window,
 * Start-menu entry and installer. The renderer uses the existing Redion UI.
 * No Node APIs reach notes or the editor; all app files are read-only.
 */
const { app, BrowserWindow, Menu, protocol, net, shell, dialog, ipcMain, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveBundledAsset } = require('./paths.cjs');
const { startRedionAutoUpdates } = require('./auto-update.cjs');
const { configuredSource, saveConfiguredSource, startSourceUpdates, validateSource } =
  require('./generated/local-source.cjs');
const { destinationFromArgs, jumpTasks, readWindowState, windowStateToSave } = require('./generated/desktop-shell.cjs');
const { NativeFiles, trustedSender, safeExportName } = require('./generated/files.cjs');

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
// Live development is intentionally separate from the installed user's notes.
// Only an explicitly chosen, read-only snapshot is served, in an isolated profile.
const LIVE = !app.isPackaged && process.env.REDION_WINDOWS_LIVE === '1' &&
  process.argv.includes('--redion-live');
// A configured checkout is never served with the real notes / production profile.
const LOCAL_SOURCE = app.isPackaged ? configuredSource(app.getPath('appData')) : null;
if (LIVE || LOCAL_SOURCE)
  app.setPath('userData', path.join(app.getPath('appData'), 'Redion-Entwicklung'));
if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  let mainWindow = null;
  let updateController = null;
  let liveReload = null;
  let localController = null;
  let servedAssets = null;
  let protocolReady = false;
  const files = new NativeFiles();
  let operations = Promise.resolve();
  const serial = fn => {
    const result = operations.then(fn);
    operations = result.catch(() => {});
    return result;
  };
  const offerFiles = paths => serial(async () => {
    let skipped = 0;
    for (const filename of paths) {
      try { if (!await files.offer(filename)) skipped++; }
      catch { skipped++; }
    }
    if (skipped) dialog.showErrorBox('Nicht alle Dateien geöffnet', skipped + ' Datei(en) konnten nicht geöffnet werden. Höchstens 16 Dateien gleichzeitig, unterstütztes Format und maximal 4 GB. Unlesbare oder veränderte Dateien bitte erneut auswählen. Originale bleiben unverändert.');
    mainWindow?.webContents.send('redion:files:available');
  });
  const argumentsFiles = args => args.filter(value => path.isAbsolute(value) && /\.(redion|pdf)$/i.test(value));
  const chooseFiles = async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'In Redion öffnen', properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Redion, PDF, Notizen und Bilder', extensions: ['redion', 'json', 'pdf', 'md', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'gif'] }]
    });
    if (!result.canceled) await offerFiles(result.filePaths);
  };

  // Jeder privilegierte Aufruf muss vom Hauptframe DER lokalen App kommen.
  // Ein importiertes Dokument/iframe bekommt weder Pfade noch Systemrechte.
  const handle = (channel, fn) => ipcMain.handle(channel, (event, ...args) => {
    if (!trustedSender(event, mainWindow?.webContents)) throw new Error('Dateizugriff nicht erlaubt.');
    return serial(() => fn(...args));
  });
  // Ziel aus der Sprungliste: der Hauptprozess merkt es, bis die App es abholt.
  // Nur Bezeichner aus der festen Liste, nie eine Adresse oder ein Pfad.
  let pendingDestination = destinationFromArgs(process.argv);
  ipcMain.handle('redion:ziel:holen', event => {
    if (!trustedSender(event, mainWindow?.webContents)) throw new Error('Zugriff nicht erlaubt.');
    const ziel = pendingDestination;
    pendingDestination = null;
    return ziel;
  });
  handle('redion:files:list', () => files.pending());
  // pick() läuft außerhalb der serial-Kette, offerFiles reiht selbst ein.
  ipcMain.handle('redion:files:pick', async event => {
    if (!trustedSender(event, mainWindow?.webContents)) throw new Error('Dateizugriff nicht erlaubt.');
    await chooseFiles();
  });
  handle('redion:files:read', (id, offset) => files.read(id, offset));
  handle('redion:files:release', id => files.release(id));
  handle('redion:save:begin', async (name, size) => {
    name = safeExportName(name);
    if (!Number.isSafeInteger(size) || size < 0 || size >= 4 * 1024 ** 3) throw new Error('Export zu groß.');
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Redion-Datei speichern', defaultPath: path.join(app.getPath('documents'), name),
      properties: ['showOverwriteConfirmation', 'createDirectory']
    });
    if (result.canceled || !result.filePath) return null;
    return files.begin(result.filePath, size);
  });
  handle('redion:save:write', (id, bytes) => files.write(id, bytes));
  handle('redion:save:commit', id => files.commit(id));
  handle('redion:save:cancel', id => files.cancel(id));

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

  app.on('second-instance', (_event, argv) => {
    void offerFiles(argumentsFiles(argv));
    const ziel = destinationFromArgs(argv);
    if (ziel) {
      pendingDestination = ziel;
      mainWindow?.webContents.send('redion:ziel:bereit');
    }
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  async function restartAfterSave(changeConfiguration) {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        await mainWindow.webContents.executeJavaScript(
          "typeof Store !== 'undefined' && typeof Store.flush === 'function' ? Store.flush() : Promise.resolve()");
      }
      // Only change the persistent launch mode after the previous notes were
      // safely stored. A failed flush must never silently switch profiles.
      changeConfiguration();
      app.relaunch();
      app.quit();
    } catch (error) {
      dialog.showErrorBox('Redion konnte nicht neu starten',
        'Die aktuelle Arbeit konnte nicht sicher gespeichert werden: ' + String(error));
    }
  }

  async function connectLocalSource() {
    const selected = await dialog.showOpenDialog(mainWindow, {
      title: 'Lokalen Redion-Projektordner auswählen',
      properties: ['openDirectory']
    });
    if (selected.canceled || !selected.filePaths[0]) return;
    const directory = selected.filePaths[0];
    try {
      validateSource(directory, app.getPath('appData'));
      const confirm = await dialog.showMessageBox(mainWindow, {
        type: 'warning', buttons: ['Abbrechen', 'Ordner verbinden'],
        defaultId: 0, cancelId: 0,
        title: 'Lokalen Entwicklungsstand verwenden?',
        message: 'Nur einem selbst bearbeiteten, vertrauenswürdigen Redion-Ordner zustimmen.',
        detail: 'Redion führt die lokal gespeicherten JavaScript-Dateien aus diesem Projekt aus. ' +
          'Die Windows-App nutzt dafür ein getrenntes Entwicklungsprofil; deine ' +
          'normalen Redion-Daten bleiben unverändert. Änderungen am nativen ' +
          'Windows-Programm benötigen weiterhin einen neuen Installer.\n\n' + directory
      });
      if (confirm.response !== 1) return;
      await restartAfterSave(() => saveConfiguredSource(app.getPath('appData'), directory));
    } catch (error) {
      dialog.showErrorBox('Redion-Ordner nicht verbunden', String(error));
    }
  }

  async function disconnectLocalSource() {
    if (!LOCAL_SOURCE) return;
    const answer = await dialog.showMessageBox(mainWindow, {
      type: 'question', buttons: ['Abbrechen', 'Trennen'],
      defaultId: 0, cancelId: 0,
      message: 'Lokalen Redion-Ordner trennen?',
      detail: 'Anschliessend startet Redion wieder mit dem installierten Programm ' +
        'und dem ursprünglichen Datenprofil. Die Entwicklungsdaten werden nicht gelöscht.'
    });
    if (answer.response !== 1) return;
    await restartAfterSave(() => saveConfiguredSource(app.getPath('appData'), null));
  }

  function showVersion() {
    let info = null;
    try {
      const source = servedAssets || (app.isPackaged
        ? path.join(process.resourcesPath, 'redion-web')
        : path.resolve(__dirname, '../build/windows-app'));
      info = JSON.parse(fs.readFileSync(path.join(source, 'version.json'), 'utf8'));
    } catch {}
    const version = typeof info?.version === 'string' ? info.version : app.getVersion();
    const changes = Array.isArray(info?.aenderungen)
      ? info.aenderungen.filter(x => typeof x === 'string').slice(0, 9) : [];
    dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Redion – Version und Änderungen',
      message: 'Redion ' + (process.platform === 'darwin' ? 'macOS ' : 'Windows ') + app.getVersion() + (LOCAL_SOURCE ? ' (lokaler Code)' : ''),
      detail: 'Webstand: ' + version + (info?.status ? ' · ' + info.status : '') +
        '\n\n' + changes.map(x => '• ' + x).join('\n') +
        (LOCAL_SOURCE ? '\n\nLokaler Ordner: ' + LOCAL_SOURCE : '') +
        '\n\nAlle Versionen: version.md im GitHub-Projekt.'
    });
  }

  function appMenu() {
    const items = [
      { label: 'Datei', submenu: [
        { label: 'Öffnen …', accelerator: 'CmdOrCtrl+O', click: () => { void chooseFiles(); } },
        ...(process.platform === 'darwin' ? [] : [
          { type: 'separator' },
          { role: 'quit', label: 'Redion beenden' }
        ])
      ] },
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
      ] },
      { label: 'Entwicklung', submenu: [
        { label: 'Lokalen Redion-Ordner verbinden …', click: () => { void connectLocalSource(); } },
        { label: 'Lokalen Ordner trennen', enabled: !!LOCAL_SOURCE,
          click: () => { void disconnectLocalSource(); } }
      ] },
      { label: 'Hilfe', submenu: [
        { label: 'Version und Änderungen …', click: showVersion }
      ] }
    ];
    // macOS keeps its application menu and survives closing its last window.
    if (process.platform === 'darwin') items.unshift({ label: 'Redion', submenu: [
      { role: 'about', label: 'Über Redion' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide', label: 'Redion ausblenden' },
      { role: 'hideOthers', label: 'Andere ausblenden' },
      { role: 'unhide', label: 'Alle einblenden' },
      { type: 'separator' },
      { role: 'quit', label: 'Redion beenden' }
    ] });
    Menu.setApplicationMenu(Menu.buildFromTemplate(items));
  }

  function launchWindow() {
    const assets = app.isPackaged
      ? path.join(process.resourcesPath, 'redion-web')
      : path.resolve(__dirname, '../build/windows-app');
    servedAssets = assets;
    if (LOCAL_SOURCE) {
      try {
        localController = startSourceUpdates({
          source: LOCAL_SOURCE,
          previewBase: path.join(app.getPath('userData'), 'lokaler-code'),
          markerDir: path.join(app.getPath('userData'), 'lokaler-live'),
          appData: app.getPath('appData'),
          onReady(directory) { servedAssets = directory; }
        });
      } catch (error) {
        dialog.showErrorBox('Lokale Redion-Version nicht verfügbar',
          String(error) + '\n\nDie installierte Oberfläche bleibt in der Entwicklungsumgebung nutzbar. ' +
          'Unter Entwicklung kannst du den Ordner erneut verbinden oder trennen.');
      }
    }

    // Fixed secure origin for IndexedDB. Even in local-code mode only a staged,
    // allowlisted web snapshot is served, never arbitrary paths or source files.
    if (!protocolReady) {
      protocol.handle(SCHEME, request => {
        const file = resolveBundledAsset(servedAssets || assets, request.url);
        if (!file) return new Response('Nicht gefunden', { status: 404 });
        return net.fetch(pathToFileURL(file).href);
      });
      protocolReady = true;
    }

    const icon = path.join(assets, 'oeffentlich/icons/icon-512.png');
    // Eine eigene kleine Datei neben dem Profil. Sie enthält nur Fensterlage,
    // keine Notizen; ist sie kaputt, startet das Fenster in der Standardgröße.
    const stateFile = path.join(app.getPath('userData'), 'fenster.json');
    const remembered = readWindowState(() => fs.readFileSync(stateFile, 'utf8'),
      screen.getAllDisplays().map(display => display.workArea));
    mainWindow = new BrowserWindow({
      title: LOCAL_SOURCE ? 'Redion · Lokaler Entwicklungsstand' : 'Redion',
      width: remembered?.width ?? 1300,
      height: remembered?.height ?? 860,
      ...(remembered ? { x: remembered.x, y: remembered.y } : {}),
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
        preload: path.join(__dirname, 'generated/preload.cjs'),
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
    // Do not run NSIS while Windows is logging off or shutting down.
    mainWindow.on('session-end', () => updateController?.onSystemShutdown?.());
    mainWindow.once('ready-to-show', () => {
      if (remembered?.maximized) mainWindow?.maximize();
      mainWindow?.show();
    });
    mainWindow.on('close', () => {
      try {
        fs.writeFileSync(stateFile, JSON.stringify(windowStateToSave(
          mainWindow.getNormalBounds(), mainWindow.isMaximized())));
      } catch { /* Fensterlage ist Komfort; sie darf das Schliessen nie aufhalten */ }
    });
    mainWindow.on('closed', () => {
      liveReload?.stop(); liveReload = null;
      localController?.stop(); localController = null;
      mainWindow = null; void serial(() => files.close());
    });
    mainWindow.loadURL(START_URL).catch(error => {
      dialog.showErrorBox('Redion konnte nicht starten', String(error));
    });
    if (LIVE || (LOCAL_SOURCE && localController)) {
      // Update only after a complete, atomically staged web snapshot.
      // Store.flush runs first; pending edits and dialogs defer the reload.
      liveReload = require('./generated/live-reload.cjs').startLiveReload({
        buildDir: LOCAL_SOURCE
          ? path.join(app.getPath('userData'), 'lokaler-live')
          : path.resolve(__dirname, '../build'),
        window: mainWindow
      });
    }
  }

  app.whenReady().then(() => {
    appMenu();
    if (process.platform === 'win32' && app.isPackaged) {
      app.setUserTasks(jumpTasks(process.execPath));
    }
    launchWindow();
    // Silent background checks ONLY in a signed NSIS release with a verified
    // HTTPS feed. An ordinary local/unsigned build remains fully offline.
    updateController = startRedionAutoUpdates({
      app,
      updater: require('electron-updater').autoUpdater,
      yaml: require('js-yaml')
    });
    void offerFiles(argumentsFiles(process.argv));
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) launchWindow();
    });
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
