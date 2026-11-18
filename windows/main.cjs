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
const { AutomationBridge, secureDirectory } = require('./generated/automation-bridge.cjs');
const { actionErrorMessage } = require('./generated/automation-contract.cjs');
const { randomUUID } = require('node:crypto');

const SCHEME = 'redion-local';
const START_URL = 'redion-local://app/index.html';
const APP_ID = 'ch.redurbabat.redion.windows';
// Bewusst getrennte Abnahme einer GEBAUTEN EXE. Keine freien Profilpfade,
// keine Änderung der normalen Ablage und keine Abschwächung der MCP-Rechte.
const testFlag = process.argv.find(value => value.startsWith('--redion-test-profile='));
const TEST_PROFILE = testFlag ? testFlag.slice('--redion-test-profile='.length) : null;
if (TEST_PROFILE !== null) {
  if (process.platform !== 'win32' || !/^[a-f0-9]{32}$/.test(TEST_PROFILE)) throw new Error('Ungültiges isoliertes Windows-Testprofil.');
  const base = path.join(app.getPath('temp'), 'Redion-Testprofile');
  secureDirectory(base);
  const directory = path.join(base, TEST_PROFILE);
  secureDirectory(directory);
  app.setPath('appData', directory);
}

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
  let rendererReady = false;
  let automationReady = false;
  const automationPending = new Map();
  const sendAutomation = (channel, ...args) => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return;
    mainWindow.webContents.send(channel, ...args);
  };
  const cancelAutomation = () => {
    sendAutomation('redion:automation:cancel');
    for (const pending of automationPending.values()) {
      clearTimeout(pending.timer);
      pending.reject(Object.assign(new Error('Die App-Verbindung wurde unterbrochen.'), { code: 'APP_DISCONNECTED' }));
    }
    automationPending.clear();
  };
  const automation = process.platform === 'win32' ? new AutomationBridge({
    userData: app.getPath('userData'), profile: TEST_PROFILE ? 'test' : LIVE || LOCAL_SOURCE ? 'development' : 'production',
    ...(app.isPackaged && !TEST_PROFILE ? { executable: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath } : {}),
    invoke: (tool, input) => new Promise((resolve, reject) => {
      if (!mainWindow || !automationReady || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
        reject(Object.assign(new Error('Die Redion-Arbeitsfläche ist noch nicht bereit.'), { code: 'APP_NOT_READY' })); return;
      }
      const id = randomUUID();
      const timer = setTimeout(() => {
        automationPending.delete(id);
        sendAutomation('redion:automation:cancel', id);
        reject(Object.assign(new Error('Die App hat nicht rechtzeitig geantwortet. Ergebnis in Redion prüfen; nicht blind wiederholen.'), { code: 'RESULT_UNKNOWN' }));
      }, 25000);
      automationPending.set(id, { resolve, reject, timer });
      sendAutomation('redion:automation:request', { id, tool, arguments: input });
    }),
    cancel: cancelAutomation,
    confirm: async (title, detail) => {
      if (!mainWindow || mainWindow.isDestroyed()) return false;
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const result = await dialog.showMessageBox(mainWindow, { type: 'warning', title,
        message: title, detail, buttons: ['Abbrechen', 'Erlauben'], defaultId: 0, cancelId: 0, noLink: true });
      return result.response === 1;
    },
    focus: () => { if (mainWindow?.isMinimized()) mainWindow.restore(); mainWindow?.show(); mainWindow?.focus(); },
    changed: () => sendAutomation('redion:automation:state')
  }) : null;
  const macOpenQueue = [];
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
  // macOS Finder opens documents using open-file, sometimes before app.ready.
  // Keep paths in memory until the existing read-only import bridge is ready.
  app.on('open-file', (event, filename) => {
    event.preventDefault();
    if (process.platform !== 'darwin' || typeof filename !== 'string' ||
        !path.isAbsolute(filename) || !/\.(redion|pdf)$/i.test(filename)) return;
    if (macOpenQueue.length >= 16) return;
    macOpenQueue.push(filename);
    if (rendererReady && mainWindow && !mainWindow.isDestroyed()) {
      void offerFiles(macOpenQueue.splice(0));
    }
  });
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
  const automationSender = event => {
    if (!trustedSender(event, mainWindow?.webContents)) throw new Error('Automatisierungszugriff nicht erlaubt.');
    if (!automation) throw new Error('Desktop-Automatisierung wird hier nicht unterstützt.');
    return automation;
  };
  ipcMain.handle('redion:automation:state', event => automationSender(event).state());
  ipcMain.handle('redion:automation:package', async event => {
    automationSender(event);
    const directory = app.isPackaged ? path.join(process.resourcesPath, 'redion-mcp') : path.resolve(__dirname, '../build/red-ion-plugin');
    if (!fs.existsSync(path.join(directory, 'mcp.json'))) throw new Error('Vorbereitetes MCP-Paket fehlt.');
    const error = await shell.openPath(directory);
    if (error) throw new Error('MCP-Paket konnte nicht geöffnet werden.');
    return { opened: true };
  });
  ipcMain.handle('redion:automation:configure', (event, policy) => serial(() => automationSender(event).configure(policy)));
  ipcMain.handle('redion:automation:disconnect', event => { automationSender(event).disconnect(); return automation.state(); });
  ipcMain.handle('redion:automation:ready', event => { automationSender(event); automationReady = true; });
  ipcMain.handle('redion:automation:reply', (event, reply) => {
    automationSender(event);
    if (!reply || typeof reply.id !== 'string' || typeof reply.ok !== 'boolean') return;
    const pending = automationPending.get(reply.id);
    if (!pending) return;
    if (JSON.stringify(reply).length > 2 * 1024 * 1024) {
      clearTimeout(pending.timer); automationPending.delete(reply.id);
      pending.reject(Object.assign(new Error('Die Ausgabe ist zu gross.'), { code: 'RESULT_TOO_LARGE' })); return;
    }
    clearTimeout(pending.timer); automationPending.delete(reply.id);
    if (reply.ok && reply.data && typeof reply.data === 'object' && !Array.isArray(reply.data)) pending.resolve(reply.data);
    else {
      const code = typeof reply.error?.code === 'string' && /^[A-Z_]{1,60}$/.test(reply.error.code) ? reply.error.code : 'ACTION_FAILED';
      pending.reject(Object.assign(new Error(actionErrorMessage(code)), { code }));
    }
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
      title: TEST_PROFILE ? 'Redion · Isoliertes Testprofil' : LOCAL_SOURCE ? 'Redion · Lokaler Entwicklungsstand' : 'Redion',
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
      automationReady = false; cancelAutomation(); automation?.disconnect();
      liveReload?.stop(); liveReload = null;
      localController?.stop(); localController = null;
      mainWindow = null; rendererReady = false; void serial(() => files.close());
    });
    // New renderer after a reopen or reload: announce Finder files only
    // once the web app can receive the same IPC as Windows drag/drop.
    rendererReady = false;
    mainWindow.webContents.on('did-start-navigation', (_event, _url, inPlace, isMainFrame) => {
      if (!isMainFrame || inPlace) return;
      rendererReady = false; automationReady = false; cancelAutomation();
    });
    mainWindow.webContents.on('did-finish-load', () => {
      rendererReady = true;
      if (macOpenQueue.length) void offerFiles(macOpenQueue.splice(0));
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
    automation?.start().catch(() => { dialog.showErrorBox('Automatisierung nicht verfügbar', 'Die lokale MCP-Verbindung konnte nicht sicher gestartet werden. Redion bleibt offline benutzbar.'); });
    appMenu();
    if (process.platform === 'win32' && app.isPackaged && !TEST_PROFILE) {
      app.setUserTasks(jumpTasks(process.execPath));
    }
    launchWindow();
    // Silent background checks ONLY in a signed NSIS release with a verified
    // HTTPS feed. An ordinary local/unsigned build remains fully offline.
    if (!TEST_PROFILE) updateController = startRedionAutoUpdates({
      app,
      updater: require('electron-updater').autoUpdater,
      yaml: require('js-yaml')
    });
    void offerFiles(argumentsFiles(process.argv));
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) launchWindow();
    });
  });
  app.on('before-quit', () => { void automation?.shutdown(); });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
