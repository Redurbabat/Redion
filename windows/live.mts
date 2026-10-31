/**
 * Redion Windows development: source folder -> build -> same Electron window.
 * Never watches an installed EXE, never updates a signed release and never
 * touches %APPDATA%\Redion. One local development session only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const windows = path.join(root, 'windows');
const build = path.join(root, 'build');
const marker = path.join(build, 'windows-live-stand.json');
const isWindows = process.platform === 'win32';

export function classifyChange(folder, filename, compiling = false) {
  // Some Windows file systems omit the filename; rebuild conservatively.
  if (typeof filename !== 'string' || !filename) {
    return folder === 'windows' ? 'native' : (folder === 'src' || folder === 'root' ? 'compile' : 'stage');
  }
  const f = filename.replace(/\\/g, '/');
  const parts = f.split('/');
  if (parts.some(part => !part || part[0] === '.' ||
      ['node_modules', 'generated', 'build', 'windows-dist', '__pycache__'].includes(part))) return null;
  if (folder === 'root') {
    if (/^(index\.html|sw\.js)$/.test(f) || /\.(?:js|css|html)$/.test(f)) return 'stage';
    if (/^(package(?:-lock)?\.json|tsconfig[^/]*\.json|dienststand\.mts|bauen-inseln\.mts)$/.test(f))
      return 'compile';
    return null;
  }
  if (folder === 'windows') {
    if (/^(?:main|paths|auto-update|update-policy|live-reload)\.cjs$/.test(f) ||
        /\.(?:cts)$/.test(f)) return 'native';
    if (/^(?:prepare|compare-web|web-files)\.(?:mjs|mts)$/.test(f)) return 'stage';
    return null;
  }
  if (folder === 'src') return /\.(?:ts|tsx|css|svg|json)$/.test(f) ? 'compile' : null;
  if (folder === 'quell') return compiling ? null : 'stage';
  return 'stage'; // all public assets (including images / fonts / JSON)
}

function run(program, args, cwd, shell = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, shell, stdio: 'inherit', windowsHide: false });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(code === 0 && !signal));
  });
}

function writeReady(number) {
  fs.mkdirSync(build, { recursive: true });
  const temp = marker + '.' + process.pid + '.tmp';
  fs.writeFileSync(temp, JSON.stringify({ revision: number, status: 'ready' }) + '\n');
  fs.renameSync(temp, marker);
}

export async function runLive() {
  let electronExecutable;
  try { electronExecutable = require('electron'); }
  catch {
    throw new Error('Electron fehlt. Zuerst "npm install --prefix windows" ausführen.');
  }
  const npm = isWindows ? 'npm.cmd' : 'npm';
  let child = null;
  const watchers = [];
  let compiling = false, running = false, closing = false;
  let revision = 0, timer = null;
  let requested = { compile: false, native: false, stage: false };

  function launchElectron() {
    child = spawn(electronExecutable, ['.', '--redion-live'], {
      cwd: windows, stdio: 'inherit',
      env: { ...process.env, REDION_WINDOWS_LIVE: '1' }
    });
    child.on('error', error => {
      console.error('Redion-Live konnte nicht starten:', error.message);
    });
    child.on('exit', (code, signal) => {
      child = null;
      if (!closing && !running) console.log(
        'Redion-Live-Fenster geschlossen. Dateibeobachtung beenden.');
      if (!closing) shutdown(code || 0);
    });
  }

  const buildOnce = async (compile, native, stage) => {
    compiling = compile;
    try {
      if (compile) {
        console.log('\n[Redion-Live] TypeScript / Webdateien bauen …');
        if (!await run(npm, ['run', 'bauen:ts'], root, isWindows)) return false;
      }
      if (native) {
        console.log('[Redion-Live] Windows-Bridge bauen …');
        if (!await run(npm, ['--prefix', 'windows', 'run', 'prepare:app'], root, isWindows))
          return false;
      } else if (stage) {
        console.log('[Redion-Live] Windows-Webdateien synchronisieren …');
        if (!await run(process.execPath, [path.join(windows, 'prepare.mjs')], root))
          return false;
      }
      return true;
    } finally { compiling = false; }
  };

  function enqueue(kind) {
    if (closing || !kind) return;
    requested.stage = true;
    if (kind === 'compile') requested.compile = true;
    if (kind === 'native') requested.native = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void processQueue(); }, 450);
  }
  async function processQueue() {
    if (closing || running) return;
    running = true;
    try {
      while (!closing && (requested.compile || requested.native || requested.stage)) {
        const next = requested;
        requested = { compile: false, native: false, stage: false };
        const result = await buildOnce(next.compile, next.native, next.stage);
        if (!result) {
          console.error('[Redion-Live] Bau fehlgeschlagen; die bisherige App bleibt geöffnet. Nach der nächsten Änderung erneut versuchen.');
          continue;
        }
        // Prevent generated JS from starting a second compilation.
        ignoredQuellUntil = Date.now() + 1200;
        if (next.native && child && !closing) {
          console.log('[Redion-Live] Native Windows-Dateien geändert: Fenster neu starten.');
          restarting = true;
          await new Promise(resolve => {
            const old = child;
            if (!old || old.exitCode !== null) return resolve();
            old.once('exit', resolve);
            old.kill();
          });
          restarting = false;
          if (!closing) launchElectron();
        }
        writeReady(++revision);
        console.log('[Redion-Live] Änderungen übernommen – Redion aktualisiert die Ansicht automatisch.');
      }
    } finally {
      running = false;
      if (!closing && (requested.compile || requested.native || requested.stage))
        enqueue('stage');
    }
  }

  let ignoredQuellUntil = 0, restarting = false;
  function watch(name, dir, recursive) {
    if (!fs.existsSync(dir)) return;
    const watcher = fs.watch(dir, { recursive }, (_event, filename) => {
      if (name === 'quell' && (compiling || Date.now() < ignoredQuellUntil)) return;
      const kind = classifyChange(name, filename?.toString(), compiling);
      enqueue(kind);
    });
    watcher.on('error', error => {
      if (!closing) console.error('[Redion-Live] Ordnerbeobachtung:', name, error.message);
    });
    watchers.push(watcher);
  }
  function shutdown(code = 0) {
    if (closing || restarting) return;
    closing = true;
    if (timer) clearTimeout(timer);
    for (const w of watchers) w.close();
    if (child) child.kill();
    process.exitCode = code;
  }
  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  console.log('Redion-Live: Änderungen im Projektordner werden automatisch übernommen.');
  // Initial build before creating a window: no stale bundled resources.
  const good = await buildOnce(true, true, true);
  if (!good) throw new Error('Erster Redion-Windows-Bau fehlgeschlagen. Siehe Fehlermeldung oben.');
  ignoredQuellUntil = Date.now() + 1200;
  writeReady(++revision);
  launchElectron();
  watch('root', root, false);
  for (const name of ['src', 'quell', 'oeffentlich', 'fremd', 'lernpakete', 'lernen', 'windows'])
    watch(name, path.join(root, name), true);
  return { shutdown };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runLive().catch(error => {
    console.error('[Redion-Live]', error.message);
    process.exitCode = 1;
  });
}
