import { _electron as electron, chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

declare const Store: any, App: any, Schaltplan: any, Stromfluss: any, GlassWheel: any, Einlesen: any, Dateien: any;
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const baseline = process.argv.includes('--baseline');
const web = process.argv.includes('--web');
const soakMs = Math.max(0, Math.min(3_600_000, Number(process.argv.find(arg => arg.startsWith('--soak-ms='))?.split('=')[1]) || 0));
const scale = Number(process.argv.find(arg => arg.startsWith('--scale='))?.split('=')[1]) || 0;
const output = path.join(root, 'bilder/windows-ink', baseline ? 'vorher' : web ? 'web' : scale ? `windows-${scale * 100}` : 'nachher');
fs.mkdirSync(output, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-ink-'));
const profile = path.join(temporary, 'appdata'); fs.mkdirSync(profile);
const bootstrap = path.join(temporary, 'bootstrap.cjs');
fs.writeFileSync(bootstrap, `const {app}=require('electron');app.setPath('appData',${JSON.stringify(profile)});require(${JSON.stringify(path.join(root, 'windows/main.cjs'))});`);
const env = Object.fromEntries(Object.entries(process.env).filter(([k, v]) => k !== 'ELECTRON_RUN_AS_NODE' && v !== undefined)) as Record<string, string>;
const native = web ? null : await electron.launch({ executablePath: require('../windows/node_modules/electron'),
  args: [bootstrap, ...(scale ? [`--force-device-scale-factor=${scale}`] : [])], env });
const browser = web ? await chromium.launch() : null;
const context = browser ? await browser.newContext({ viewport: { width: 1300, height: 860 },
  recordVideo: { dir: output, size: { width: 1300, height: 860 } } }) : null;
const page: Page = native ? await native.firstWindow() : await context!.newPage();
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let blockId = '';
try {
  if (web) await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    const plan = Schaltplan.neuerPlan(); plan.breite = 800; plan.hoehe = 500;
    Schaltplan.beispielBauen(plan, 'wechselschaltung', 'plan');
    const note = Store.addPage(null, { text: 'Windows · Strom und Handschrift', icon: '⚡' });
    const block = Store.addBlock(note.id, 'schaltplan', { text: 'Installationsschaltung', plan });
    await Store.flush(); return { page: note.id, block: block.id };
  });
  blockId = ids.block;
  await page.evaluate(id => { App.zeichneBaum(); App.oeffne(id); }, ids.page);
  await page.waitForSelector('.sp-wrap svg.sp-flaeche');
  await page.evaluate(() => document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove()));
  await page.locator('.sp-wrap').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(output, '01-klassisch.png') });
  const count = () => page.evaluate(id => Store.getBlock(id).plan.ink?.length || 0, blockId);
  const frameTimes = await page.evaluate(() => new Promise<number[]>(resolve => {
    const times: number[] = []; let before = performance.now();
    const tick = (now: number) => { times.push(now - before); before = now;
      if (times.length < 90) requestAnimationFrame(tick); else resolve(times.slice(1)); };
    requestAnimationFrame(tick);
  }));
  const frames = frameTimes.slice().sort((a, b) => a - b);
  const report: Record<string, unknown> = { baseline, runtime: web ? 'Chromium' : 'Electron',
    platform: os.platform(), release: os.release(), frameP95: frames[Math.floor(frames.length * .95)],
    deviceScale: await page.evaluate(() => window.devicePixelRatio),
    hardwarePen: 'NICHT GETESTET', manual30Minutes: 'NICHT GETESTET' };
  if (!baseline) {
    await page.evaluate(() => {
      const times: number[] = []; (window as any).__inkDurations = times;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => original(now => {
        const active = !!document.querySelector('.sp-ink-aktiv'), start = performance.now();
        callback(now); if (active) times.push(performance.now() - start);
      });
    });
    await page.locator('.sp-wrap').focus(); await page.keyboard.press('f');
    await page.waitForTimeout(500);
    await page.locator('[data-wz="stift"]').click();
    const area = await page.locator('.sp-buehne').boundingBox(); assert.ok(area);
    const x = area.x + area.width * .35, y = area.y + area.height * .55;
    await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 48; i++) await page.mouse.move(x + i * 3, y + Math.sin(i / 4) * 18);
    assert.equal(await count(), 0, 'Kein Zwischenbild gelangt in den gespeicherten Plan');
    await page.mouse.up();
    assert.equal(await count(), 1, 'Ein Mauszug ergibt eine Annotation');
    await page.keyboard.press('Control+z'); assert.equal(await count(), 0);
    await page.keyboard.press('Control+y'); assert.equal(await count(), 1);
    await page.mouse.move(x, y + 35); await page.mouse.down(); await page.mouse.move(x + 60, y + 45);
    await page.keyboard.press('Escape'); await page.mouse.up(); assert.equal(await count(), 1, 'Escape verwirft nur den laufenden Strich');
    const electrical = await page.evaluate(id => {
      const p = Store.getBlock(id).plan; return JSON.stringify(Stromfluss.rechne(p, {}, {}));
    }, blockId);
    await page.locator('.sp-start').click();
    await page.locator('[data-wz="stift"]').click();
    await page.mouse.move(x, y - 40); await page.mouse.down();
    await page.mouse.move(x + 110, y - 30, { steps: 24 }); await page.mouse.up();
    assert.equal(await count(), 2, 'Freihand bleibt bei laufender Simulation möglich');
    assert.equal(await page.evaluate(id => JSON.stringify(Stromfluss.rechne(Store.getBlock(id).plan, {}, {})), blockId), electrical);
    await page.screenshot({ path: path.join(output, '02-strom-und-notizen.png') });
    await page.locator('[data-ink-mode="erase"]').click();
    await page.locator('.sp-buehne').scrollIntoViewIfNeeded();
    const erasePoint = await page.evaluate(id => {
      const mark = Store.getBlock(id).plan.ink.at(-1);
      const p = mark.pts[Math.floor(mark.pts.length / 2)];
      const matrix = document.querySelector<SVGSVGElement>('.sp-flaeche')!.getScreenCTM()!;
      const q = new DOMPoint(p[0], p[1]).matrixTransform(matrix); return { x: q.x, y: q.y };
    }, blockId);
    const wires = await page.evaluate(id => JSON.stringify(Store.getBlock(id).plan.leitungen), blockId);
    await page.mouse.move(erasePoint.x, erasePoint.y); await page.mouse.down(); await page.mouse.up();
    assert.equal(await count(), 1);
    assert.equal(await page.evaluate(id => JSON.stringify(Store.getBlock(id).plan.leitungen), blockId), wires, 'Tintenradierer verändert keine Leitung');
    await page.keyboard.press('Control+z'); assert.equal(await count(), 2);
    await page.locator('.sp-start').click();
    await page.locator('[data-wz="stift"]').click();
    await page.locator('[data-ink-mode="draw"]').click();
    await page.locator('.sp-buehne').scrollIntoViewIfNeeded();
    const penArea = await page.locator('.sp-buehne').boundingBox(); assert.ok(penArea);
    const px = penArea.x + penArea.width * .55, py = penArea.y + penArea.height * .5;
    const expectedPenEnd = await page.evaluate(({ x, y }) => {
      const q = new DOMPoint(x, y).matrixTransform(document.querySelector<SVGSVGElement>('.sp-flaeche')!.getScreenCTM()!.inverse());
      return [+q.x.toFixed(2), +q.y.toFixed(2)];
    }, { x: px + 48, y: py + Math.sin(4) * 10 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, pointerType: 'pen', force: .2, tiltX: 20 });
    await page.locator('.sp-flaeche').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 8001, clientX: px + 20, clientY: py + 10, button: 0, buttons: 1 });
    for (let i = 1; i <= 12; i++) await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x: px + i * 4, y: py + Math.sin(i / 3) * 10, button: 'left', buttons: 1, pointerType: 'pen', force: .2 + i / 20, tiltX: 20 + i });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px + 48, y: py + Math.sin(4) * 10, button: 'left', buttons: 0, pointerType: 'pen' });
    await cdp.detach();
    const pen = await page.evaluate(id => Store.getBlock(id).plan.ink.at(-1), blockId);
    assert.equal(await count(), 3, 'Der Handballenkontakt kapert den Stiftzug nicht');
    assert.equal(pen.pressure.length, pen.pts.length);
    assert.equal(pen.neigung.length, pen.pts.length);
    assert.ok(pen.neigung.every((value: number) => value >= 0 && value <= 1), 'Neigung benutzt den gemeinsamen normierten Sensorkanal');
    assert.ok(new Set(pen.pressure).size > 2, 'Emulierte Druckwerte bleiben erhalten');
    assert.deepEqual(pen.pts.at(-1), expectedPenEnd, 'Die gespeicherte Spitze endet am echten Absetzpunkt');
    const renderTimes: number[] = await page.evaluate(() => (window as any).__inkDurations);
    renderTimes.sort((a, b) => a - b);
    const renderP95 = renderTimes[Math.floor(renderTimes.length * .95)];
    assert.ok(renderP95 !== undefined && renderP95 <= 8, `Strichvorschau p95 ${renderP95} ms`);
    report.inkCallback = { samples: renderTimes.length, p95: renderP95, max: renderTimes.at(-1),
      fixture: 'Wechselschaltung, Maus- und emulierte Stiftstriche' };
    await page.keyboard.press('Control+z'); assert.equal(await count(), 2);
    const persisted = await page.evaluate(async id => { await Store.flush(); return Store.getBlock(id).plan; }, blockId);
    assert.match(await page.evaluate(p => Schaltplan.alsSvg(Schaltplan.lesen({ plan: p })), persisted), /data-ink=/);
    await page.reload();
    await page.waitForFunction(id => typeof Store !== 'undefined' && !!Store.getBlock(id), blockId);
    assert.deepEqual(await page.evaluate(id => Store.getBlock(id).plan, blockId), persisted, 'Neuladen erhält alle Plan- und Freihanddaten');
    await page.evaluate(id => App.oeffne(id), ids.page);
    await page.waitForSelector('[data-wz="stift"]');
    await page.evaluate(() => GlassWheel.setMode('glass-wheel'));
    await page.locator('[data-wz="stift"]').click();
    await page.locator('.sp-wrap').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, '03-liquid-glass-dunkel.png') });
    await page.evaluate(() => document.body.dataset.kontrast = 'hoch');
    assert.equal(await page.locator('.sp-ink-tools').evaluate(el => getComputedStyle(el).backdropFilter), 'none');
    await page.evaluate(() => delete document.body.dataset.kontrast);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.screenshot({ path: path.join(output, '04-liquid-glass-ruhig.png') });
    await page.evaluate(() => GlassWheel.setMode('classic'));
    if (web) {
      const restored = await page.evaluate(async id => {
        const original = Store.getBlock(id).plan;
        await Dateien.ablegen(new File(['Nur synthetische Testdaten'], 'ink-test.txt', { type: 'text/plain' }), { blockId: id, name: 'ink-test.txt' });
        await Store.flush();
        let archive: Blob | null = null;
        const create = URL.createObjectURL, click = HTMLAnchorElement.prototype.click;
        URL.createObjectURL = (blob: Blob | MediaSource) => { if (blob instanceof Blob) { archive = blob; return 'blob:test-archive'; } return create(blob); };
        HTMLAnchorElement.prototype.click = function () { if (!this.download) click.call(this); };
        try { await App.sicherungSpeichern(); }
        finally { URL.createObjectURL = create; HTMLAnchorElement.prototype.click = click; }
        if (!archive) throw new Error('Der echte Sicherungsweg erzeugte kein Archiv');
        const zip = await Einlesen.zipLesenAusBlob(archive);
        const json = await zip.text('daten.json');
        await Store.wipe(); await Store.importAll(json, 'ersetzen'); await Store.flush();
        return { before: original, after: Store.getBlock(id).plan };
      }, blockId);
      assert.deepEqual(restored.after, restored.before, 'Echtes .redion-Archiv erhält alle Freihanddaten');
    }
    if (soakMs) {
      await page.locator('.sp-wrap').focus(); await page.keyboard.press('6');
      await page.locator('.sp-buehne').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const trace: unknown[] = []; (window as any).__inkTrace = trace;
        for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(type, event => {
          const e = event as PointerEvent; trace.push({ type, id: e.pointerId, kind: e.pointerType,
            target: (e.target as Element).tagName, x: e.clientX, y: e.clientY }); if (trace.length > 12) trace.shift();
        }, true);
      });
      const area = await page.locator('.sp-buehne').boundingBox(); assert.ok(area);
      // Eigenes Testfenster verstecken: reale Eingaben am gemeinsam benutzten
      // Windows-Rechner sollen weder die Probe noch die Arbeit unterbrechen.
      if (native) await native.evaluate(({ BrowserWindow }) => {
        for (const window of BrowserWindow.getAllWindows()) { window.webContents.setBackgroundThrottling(false); window.hide(); }
      });
      const begin = Date.now(); let rounds = 0, cancelled = 0, nextReport = begin + 60_000;
      while (Date.now() - begin < soakMs) {
        const x = area.x + area.width * .4, y = area.y + area.height * .5;
        await page.mouse.move(x, y); await page.mouse.down();
        for (let i = 1; i <= 16; i++) await page.mouse.move(x + i * 3, y + Math.sin(i / 3 + rounds) * 12);
        await page.mouse.up(); const written = await count();
        if (written === 3) { await page.keyboard.press('Control+z'); assert.equal(await count(), 2); rounds++; }
        else { assert.equal(written, 2); cancelled++; }
        if (Date.now() >= nextReport) { console.log(`Dauerlauf: ${Math.round((Date.now() - begin) / 1000)} s, ${rounds} vollständige Schreibzüge.`); nextReport += 60_000; }
        await page.waitForTimeout(100);
      }
      assert.ok(rounds > 0, 'Die Anwendung nimmt auch nach Unterbrechungen weiter Striche an');
      report.soak = { milliseconds: Date.now() - begin, strokes: rounds, cancelled,
        input: 'Playwright-Maus im verborgenen Electron-Testfenster, kein Hardwarestift' };
    }
    report.annotations = persisted.ink.length;
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'messung.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  console.log(baseline ? '✓ Windows-Ausgangsbild und Bildtakt gemessen.' : '✓ Freihand, Simulation, Verlauf, Tintenradierer, SVG und lokaler Neustart.');
} catch (error) {
  console.error('Seitenfehler:', errors);
  console.error('Eingabespur:', await page.evaluate(() => ({ trace: (window as any).__inkTrace,
    active: document.querySelector('.sp-wrap')?.className,
    tool: document.querySelector('.sp-wz[aria-pressed="true"]')?.getAttribute('data-wz') })));
  await page.screenshot({ path: path.join(output, 'fehler.png') }).catch(() => {});
  throw error;
} finally {
  await native?.close(); await context?.close(); await browser?.close();
  fs.rmSync(temporary, { recursive: true, force: true });
}
