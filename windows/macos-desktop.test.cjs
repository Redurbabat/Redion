'use strict';
/* Contract tests for the new macOS packaging path. These inspect the actual
 * Electron shell and never start Electron or touch a user's profile. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pkg = require('./package.json');
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8');
const updater = fs.readFileSync(path.join(__dirname, 'update-policy.cjs'), 'utf8');
const prepare = fs.readFileSync(path.join(__dirname, 'prepare.mjs'), 'utf8');

test('Mac build reuses existing offline web assets without a second Redion app', () => {
  assert.match(pkg.scripts['dist:mac'], /npm run prepare:app/);
  assert.match(pkg.scripts['dist:mac'], /electron-builder --mac dmg zip --arm64/);
  assert.match(pkg.scripts['dist:mac'], /build\/macos-dist/);
  assert.equal(pkg.build.extraResources[0].to, 'redion-web');
  assert.match(prepare, /compareWindowsWeb\(root, target\)/);
  assert.match(main, /redion-local:\/\/app\/index\.html/);
  assert.equal(fs.existsSync(path.join(root, 'oeffentlich/icons/icon-512.png')), true);
});

test('macOS has separate bundle identity while Windows identity and installers stay unchanged', () => {
  assert.equal(pkg.build.appId, 'ch.redurbabat.redion.windows');
  assert.equal(pkg.build.mac.appId, 'ch.redurbabat.redion.macos');
  assert.notEqual(pkg.build.mac.appId, pkg.build.appId);
  assert.equal(pkg.build.mac.category, 'public.app-category.productivity');
  assert.deepEqual(pkg.build.mac.target.map(x => x.target), ['dmg', 'zip']);
  for (const target of pkg.build.mac.target) assert.deepEqual(target.arch, ['arm64']);
  assert.match(pkg.scripts.dist, /--win nsis portable --x64/);
});

test('macOS window lifecycle and menu use native conventions', () => {
  assert.match(main, /if \(process\.platform === 'darwin'\) items\.unshift/);
  assert.match(main, /role: 'about'/);
  assert.match(main, /role: 'quit'/);
  assert.match(main, /if \(process\.platform !== 'darwin'\) app\.quit\(\)/);
  assert.match(main, /app\.on\('activate'/);
  assert.match(main, /app\.setPath\('userData', path\.join\(app\.getPath\('appData'\), 'Redion'\)\)/);
  assert.match(main, /contextIsolation: true/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /nodeIntegration: false/);
});

test('unsigned macOS preview cannot enable Windows NSIS auto-updater', () => {
  assert.match(updater, /platform === 'win32'/);
  assert.match(main, /startRedionAutoUpdates/);
  assert.doesNotMatch(pkg.scripts['dist:mac'], /publish|deploy|notarize/);
});
