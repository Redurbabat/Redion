'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveBundledAsset } = require('./paths.cjs');

test('only packaged Redion assets can be served under stable local origin', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-windows-assets-'));
  try {
    fs.mkdirSync(path.join(root, 'quell'), { recursive: true });
    fs.writeFileSync(path.join(root, 'index.html'), 'OFFLINE');
    fs.writeFileSync(path.join(root, 'quell/start.js'), '// script');
    const homepage = resolveBundledAsset(root, 'redion-local://app/');
    assert.equal(homepage, fs.realpathSync(path.join(root, 'index.html')));
    const script = resolveBundledAsset(root, 'redion-local://app/quell/start.js');
    assert.equal(script, fs.realpathSync(path.join(root, 'quell/start.js')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('no arbitrary files, links, other hosts, paths or unknown documents', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-windows-deny-'));
  try {
    fs.writeFileSync(path.join(root, 'index.html'), 'OK');
    for (const url of [
      'https://redion.ch/', 'file:///C:/Windows/win.ini',
      'redion-local://another/index.html',
      'redion-local://app/not-found.js',
      'redion-local://app/%00bad',
      'redion-local://app/%5cWindows',
      'redion-local://app/%2fetc/passwd',
      'redion-local://app/index.html?file=secrets',
      'redion-local://app/',
    ].slice(0, -1)) {
      assert.equal(resolveBundledAsset(root, url), null, url);
    }
    assert.equal(resolveBundledAsset(root, 'redion-local://app/index.html'),
      fs.realpathSync(path.join(root, 'index.html')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Windows installer packages two EXEs and a stable offline data profile', () => {
  const pkg = require('./package.json');
  const main = fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8');
  const prepare = fs.readFileSync(path.join(__dirname, 'prepare.mjs'), 'utf8');
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal(pkg.build.productName, 'Redion');
  assert.equal(pkg.main, 'main.cjs');
  assert.match(pkg.scripts.dist, /electron-builder --win nsis portable --x64/);
  assert.match(JSON.stringify(pkg.build.win.target), /nsis/);
  assert.match(JSON.stringify(pkg.build.win.target), /portable/);
  assert.match(main, /app\.setPath\('userData', path\.join\(app\.getPath\('appData'\), 'Redion'\)\)/);
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /webSecurity: true/);
  assert.match(main, /setPermissionRequestHandler/);
  assert.match(prepare, /\['quell','oeffentlich','fremd','lernpakete','lernen'\]/);
  assert.match(prepare, /index\.html', 'sw\.js/);
  assert.match(html, /quell\/start\.js/);
  assert.doesNotMatch(main, /loadURL\(['"]https?:/);
});

test('local-first app and iOS app are never modified by Windows packager', () => {
  const script = fs.readFileSync(path.join(__dirname, 'prepare.mjs'), 'utf8');
  const pkg = require('./package.json');
  assert.match(script, /build\/windows-app/);
  assert.doesNotMatch(script, /fs\.rmSync|index\.html'.*fs\.writeFileSync|capacitor\.config\.json/);
  assert.equal(pkg.build.extraResources[0].to, 'redion-web');
  assert.match(JSON.stringify(pkg.build.files), /main\.cjs/);
  assert.equal(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../capacitor.config.json'))).appId,
    'ch.redurbabat.redion');
});
