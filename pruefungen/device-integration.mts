import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'bilder/geraete-integration');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [width, height] of [[390, 844], [430, 932], [1366, 768], [1440, 900]] as const) {
    for (const light of [false, true]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
      await page.waitForFunction(() => typeof DeviceIntegration !== 'undefined' &&
        !!Register.befehle.alle().find((command: any) => command.titel === 'iPhone, Windows und Sicherungen'));
      await page.evaluate(lightMode => {
        document.querySelectorAll('.onboarding-overlay,.onboarding,.tour-overlay').forEach(element => element.remove());
        Aussehen.setzen({ schema: lightMode ? 'hell' : 'standard' });
        Einstellungen.oeffne('geraete');
      }, light);
      const deviceNavigation = page.locator('.einst-nav [data-b="geraete"]');
      if (width < 700 && await deviceNavigation.isVisible()) await deviceNavigation.click();
      await page.locator('.dev-overview').waitFor();
      assert.equal(await page.locator('.dev-actions button').count(), 4);
      for (const button of await page.locator('.dev-actions button').all()) {
        const rect = await button.boundingBox();
        assert.ok(rect && rect.height >= 44 && rect.width >= 44);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.match(await page.locator('.dev-overview').innerText(), /getrennte lokale Speicher/);
      assert.match(await page.locator('.dev-overview').innerText(), /Keine vollständige Sicherung bekannt/);
      await page.locator('.dev-actions button').first().focus();
      assert.equal(await page.locator('.dev-actions button').first().evaluate(button => button === document.activeElement), true);
      await page.screenshot({ path: path.join(output, `${width}-${light ? 'hell' : 'dunkel'}.png`) });
      await page.locator('.dev-overview summary').click();
      await page.locator('.dev-warning').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `${width}-${light ? 'hell' : 'dunkel'}-anleitung.png`) });
      await page.evaluate(() => {
        Store.setMeta('sicherung:zuletzt', '2026-10-29T12:00:00.000Z');
        Store.setMeta('sicherung:art', 'redion');
      });
      const snapshot = await page.evaluate(() => DeviceIntegration.snapshot());
      assert.equal(snapshot.backup.art, 'redion'); assert.ok(snapshot.backup.wann);
      assert.equal(snapshot.disk, true);
      assert.match(snapshot.sync, /Ausgeschaltet/);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`✓ Geräteübersicht ${width}×${height}, ${light ? 'hell' : 'dunkel'}, Tastatur und ruhige Bewegung`);
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => typeof DeviceIntegration !== 'undefined' && !!Store.cache && !Store.speichertNicht());
  // Nur synthetische Testdaten; keine Dateien der installierten Windows-App.
  const result = await page.evaluate(async () => {
    const errors: string[] = [];
    const originalDialog = Dialog.wahl;
    const originalNative = (globalThis as any).RedionNativeSicherung;
    let writes = 0, total = 0, committed = false;
    const originalDesktop = (globalThis as any).RedionDesktop;
    try {
      (globalThis as any).RedionDesktop = {
        saveBegin: async () => 'export-id',
        saveWrite: async (_id: string, bytes: Uint8Array) => { writes++; total += bytes.length; },
        saveCommit: async () => { committed = true; return true; }, saveCancel: async () => {}
      };
      await DeviceIntegration.save(new Blob([new Uint8Array(2 * 1024 * 1024 + 9)]), 'Test.redion');
      Dialog.wahl = async () => '';
      const before = Object.keys(Store.cache.blocks).length;
      await DeviceIntegration.importFile(new File(['Test'], 'abgebrochen.txt'));
      if (Object.keys(Store.cache.blocks).length !== before) errors.push('Abbrechen hat Daten verändert');
      Dialog.wahl = async () => 'open';
      await DeviceIntegration.importFile(new File(['# Geräteprüfung\n\nOffline bleibt erhalten.'], 'Uebergabe.md', { type: 'text/markdown' }));
      await Store.flush();
      const imported = Object.values(Store.cache.blocks).some((block: any) => /Uebergabe|Geräteprüfung/.test(block.text || ''));
      (globalThis as any).RedionDesktop.saveBegin = async () => null;
      let canceled = false;
      try { await DeviceIntegration.save(new Blob(['no']), 'nicht-speichern.redion'); }
      catch (error) { canceled = error instanceof DOMException && error.name === 'AbortError'; }
      const backup = Store.getMeta('sicherung:zuletzt', '');
      (globalThis as any).RedionNativeSicherung = { speichern: async () => { throw new Error('Prüfung: Schreiben gescheitert'); } };
      const originalAlert = window.alert; window.alert = () => {};
      let success, invalidRejected = false;
      try {
        success = await App.sicherungSpeichern();
        try { await DeviceIntegration.importFile(new File(['kein JSON'], 'kaputt.redion')); }
        catch { invalidRejected = true; }
      } finally { window.alert = originalAlert; }
      return { errors, writes, total, committed, imported, canceled, success,
        invalidRejected, backupUnchanged: backup === Store.getMeta('sicherung:zuletzt', '') };
    } finally {
      Dialog.wahl = originalDialog;
      (globalThis as any).RedionDesktop = originalDesktop;
      (globalThis as any).RedionNativeSicherung = originalNative;
    }
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.writes, 3); assert.equal(result.total, 2 * 1024 * 1024 + 9);
  assert.equal(result.committed, true); assert.equal(result.imported, true);
  assert.equal(result.canceled, true); assert.equal(result.success, false); assert.equal(result.backupUnchanged, true);
  assert.equal(result.invalidRejected, true);
  await context.close();
  console.log('✓ Native Stücke, Abbrechen, echter Markdown-Import und kein falscher Sicherungszeitpunkt bei Schreibfehler');
} finally { await browser.close(); }
