'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { validUpdateUrl, updateEligible } = require('./update-policy.cjs');
const { startRedionAutoUpdates } = require('./auto-update.cjs');

function config(run, overrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-update-test-'));
  try {
    const value = {
      provider: 'generic',
      url: 'https://updates.example.invalid/windows/',
      publisherName: 'Redion Verified Publisher',
      ...overrides
    };
    fs.writeFileSync(path.join(dir, 'app-update.yml'), JSON.stringify(value));
    // JSON is a valid subset of YAML. No external dependency in unit tests.
    return run({ dir, yaml: { load: JSON.parse } });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('only HTTPS without credentials is an eligible update source', () => {
  for (const bad of [
    '', 'http://example.invalid/', 'https://a:b@example.invalid/',
    'https://example.invalid:8443/', 'https://example.invalid/?token=x',
    'https://example.invalid/#fragment', 'file:///C:/update',
    'https://build.local/', 'javascript:alert(1)'
  ]) assert.equal(validUpdateUrl(bad), false, bad);
  assert.equal(validUpdateUrl('https://updates.example.invalid/windows/'), true);
});

test('unsigned, private-provider and untrusted release config can NEVER auto update', () => {
  for (const broken of [
    { provider: 'github' },
    { url: 'http://update.example.invalid' },
    { publisherName: undefined },
    { publisherName: [] },
    { publisherName: '' },
    { verifyUpdateCodeSignature: false }
  ]) {
    config(({ dir, yaml }) => assert.equal(updateEligible({
      platform: 'win32', packaged: true,
      portable: false, resourcePath: dir, yaml
    }), false), broken);
  }
  assert.equal(updateEligible({
    platform: 'win32', packaged: true, portable: false,
    resourcePath: 'X:/no-published-config',
    yaml: { load: JSON.parse }
  }), false);
});

test('dev, non-Windows, portable and unpacked apps never update', () => {
  config(({ dir, yaml }) => {
    const base = { platform: 'win32', packaged: true, portable: false,
      resourcePath: dir, yaml };
    assert.equal(updateEligible(base), true);
    assert.equal(updateEligible({ ...base, platform: 'darwin' }), false);
    assert.equal(updateEligible({ ...base, packaged: false }), false);
    assert.equal(updateEligible({ ...base, portable: true }), false);
  });
});

test('signed NSIS app silently checks every six hours and never force-restarts', async () => {
  await config(async ({ dir, yaml }) => {
    const updater = new EventEmitter();
    let checks = 0;
    updater.checkForUpdates = async () => { checks += 1; };
    const callbacks = [];
    const control = startRedionAutoUpdates({
      app: { isPackaged: true },
      processInfo: { platform: 'win32', env: {} },
      resourcesPath: dir, yaml, updater,
      delay: (fn, duration) => {
        assert.equal(duration, 30_000);
        callbacks.push(fn);
        return { unref() {} };
      },
      repeat: (fn, duration) => {
        assert.equal(duration, 6 * 60 * 60 * 1000);
        callbacks.push(fn);
        return { unref() {} };
      },
      logger: { warn() {}, info() {} }
    });
    assert.equal(control.enabled, true);
    assert.equal(updater.autoDownload, true);
    assert.equal(updater.autoInstallOnAppQuit, true);
    assert.equal(updater.allowDowngrade, false);
    assert.equal(updater.allowPrerelease, false);
    assert.equal(callbacks.length, 2);
    callbacks[0]();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(checks, 1);
    callbacks[1]();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(checks, 2);
    assert.equal(typeof updater.quitAndInstall, 'undefined',
      'no forced shutdown while Redion is editing');
    control.stop();
    callbacks[1]();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(checks, 2);
  });
});

test('portable build skips updater even with signed feed present', () => {
  config(({ dir, yaml }) => {
    const x = startRedionAutoUpdates({
      app: { isPackaged: true },
      processInfo: { platform: 'win32', env: { PORTABLE_EXECUTABLE_FILE: 'X:/Redion.exe' } },
      resourcesPath: dir, yaml,
      updater: new EventEmitter()
    });
    assert.equal(x.enabled, false);
  });
});

test('auto update is limited to packaged signed Windows builds', () => {
  const fs = require('node:fs');
  const main = fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8');
  const pkg = require('./package.json');
  assert.match(main, /startRedionAutoUpdates\(/);
  assert.match(main, /require\('electron-updater'\)\.autoUpdater/);
  assert.equal(pkg.dependencies['electron-updater'], '6.8.10');
  assert.equal(pkg.dependencies['js-yaml'], '4.1.0');
  assert.equal(pkg.build.appId, 'ch.redurbabat.redion.windows');
  assert.equal(pkg.build.productName, 'Redion');
  assert.deepEqual(pkg.build.files.filter(x => x.endsWith('auto-update.cjs')), ['auto-update.cjs']);
});

test('signed release builder rejects unsigned releases and preserves unsigned dev build', async () => {
  const { releaseConfiguration } = await import('./release-signed.mjs');
  const pkg = require('./package.json');
  assert.match(pkg.scripts.dist, /nsis portable/);
  assert.throws(() => releaseConfiguration({ REDION_UPDATE_URL: 'http://wrong.invalid' }),
    /HTTPS/);
  assert.throws(() => releaseConfiguration({ REDION_UPDATE_URL: 'https://updates.example.invalid/' }),
    /PUBLISHER/);
  assert.throws(() => releaseConfiguration({
    REDION_UPDATE_URL: 'https://updates.example.invalid/',
    REDION_WINDOWS_PUBLISHER: 'Verified Publisher'
  }), /Zertifikat/);
  if (pkg.version === '2026.8.3') {
    assert.throws(() => releaseConfiguration({
      REDION_UPDATE_URL: 'https://updates.example.invalid/',
      REDION_WINDOWS_PUBLISHER: 'Verified Publisher',
      CSC_LINK: 'private-file.pfx',
      CSC_KEY_PASSWORD: 'local-secret'
    }), /Version/);
  }
});
