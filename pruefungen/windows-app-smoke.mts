import { _electron as electron } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-native-smoke-'));
const profile = path.join(temporary, 'isolated-app-data');
fs.mkdirSync(profile);
const bootstrap = path.join(temporary, 'bootstrap.cjs');
// Testprozess setzt appData VOR Laden des unveränderten Produkt-Einstiegs.
// Die bestehende installierte App / %APPDATA%\Redion bleiben unberührt.
fs.writeFileSync(bootstrap, `const { app } = require('electron');\napp.setPath('appData', ${JSON.stringify(profile)});\nrequire(${JSON.stringify(path.join(root, 'windows/main.cjs'))});\n`);
const executablePath: string = require('../windows/node_modules/electron');
const env: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) if (value !== undefined) env[key] = value;
delete env.ELECTRON_RUN_AS_NODE;
let current: Awaited<ReturnType<typeof electron.launch>> | undefined;
try {
  // Sprungliste: dieselbe Befehlszeile, die Windows beim Antippen übergibt.
  {
    current = await electron.launch({ executablePath, args: [bootstrap, '--redion-ziel=neu'], env });
    const page = await current.firstWindow();
    await page.waitForFunction(() => typeof App !== 'undefined' && !!App.aktuelleSeite?.() &&
      document.activeElement?.id === 'title', undefined, { timeout: 30000 });
    assert.equal(await page.evaluate(() => (window as any).RedionDesktop.takeDestination()), null,
      'ein Ziel wird nur einmal abgeholt');
    await current.close();
    current = undefined;
    assert.equal(JSON.parse(fs.readFileSync(path.join(profile, 'Redion', 'fenster.json'), 'utf8')).width >= 860, true,
      'die Fensterlage ist beim Schliessen gemerkt');
  }
  let id = '';
  for (let run = 0; run < 2; run++) {
    current = await electron.launch({ executablePath, args: [bootstrap], env });
    assert.equal(await current.evaluate(({ app }) => app.getPath('userData')), path.join(profile, 'Redion'));
    const page = await current.firstWindow();
    await page.waitForFunction(() => typeof DeviceIntegration !== 'undefined' &&
      Register.befehle.alle().some((command: any) => command.titel === 'iPhone, Windows und Sicherungen'));
    const state = await page.evaluate(async () => ({
      platform: DeviceIntegration.snapshot().platform,
      origin: location.href,
      nodeHidden: typeof (window as any).require === 'undefined' && typeof (window as any).process === 'undefined',
      native: typeof (window as any).RedionDesktop?.saveBegin === 'function',
      pending: await (window as any).RedionDesktop.pending()
    }));
    assert.equal(state.platform, 'Windows-App');
    assert.equal(state.origin.split('#')[0], 'redion-local://app/index.html');
    assert.equal(state.nodeHidden, true); assert.equal(state.native, true);
    assert.deepEqual(state.pending, []);
    if (run === 0) {
      id = await page.evaluate(async () => {
        const note = Store.addPage(null, { text: 'Native Neustartprüfung – nur Testdaten' });
        await Store.flush(); return note.id;
      });
    } else {
      assert.equal(await page.evaluate(noteId => Store.getBlock(noteId)?.text, id), 'Native Neustartprüfung – nur Testdaten');
      await page.evaluate(() => Einstellungen.oeffne('geraete'));
      fs.mkdirSync(path.join(root, 'bilder/geraete-integration'), { recursive: true });
      await page.screenshot({ animations: 'disabled', path: path.join(root, 'bilder/geraete-integration/windows-app.png') });
    }
    await current.close(); current = undefined;
  }
  console.log('✓ Echte Electron-App: sichere Brücke, unveränderte Herkunft, lokaler Datenerhalt nach Neustart; ausschließlich isoliertes Testprofil.');
} finally {
  await current?.close();
  // Nur das von diesem Test selbst erzeugte temporäre Profil.
  fs.rmSync(temporary, { recursive: true, force: true });
}
