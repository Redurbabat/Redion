/* Regression: PR207-Doppelklick darf nie still eine alte App oeffnen.
 * Statische cmd.exe-Vertragspruefung ohne Windows-Electron-Abhaengigkeit.
 *
 *   node --test windows/pr207-launcher.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = fs.readFileSync(path.join(root, 'Redion-PR207-Live.bat'), 'utf8');
const live = fs.readFileSync(path.join(root, 'Redion-Live.bat'), 'utf8');
const check = fs.readFileSync(path.join(root, 'Redion-Schaltplan-Pruefen.bat'), 'utf8');

test('PR207-Live verwendet den einzigen sicheren Hol-Ablauf', () => {
  assert.match(launcher, /set "ZIEL=ux\/windows-schaltplan-dock-20261108"/);
  assert.match(launcher, /call "%~dp0holen\.bat" "%ZIEL%"/);
  assert.doesNotMatch(launcher, /^\s*git\s+(?:checkout|reset|stash|push|merge)\b/im);
  assert.doesNotMatch(launcher, /call "%~dp0holen\.bat" "main"/i);
});

test('PR207-Live kontrolliert Branch und GitHub-Commit vor dem Start', () => {
  const fetch = launcher.indexOf('call "%~dp0holen.bat" "%ZIEL%"');
  const branch = launcher.indexOf('if /I not "%LOKALZWEIG%"=="%ZIEL%"');
  const remote = launcher.indexOf('git ls-remote --heads origin "refs/heads/%ZIEL%"');
  const hash = launcher.indexOf('if /I not "%LOKALSHA%"=="%REMOTESHA%"');
  const launch = launcher.indexOf('call "%~dp0Redion-Live.bat"');
  assert.ok(fetch >= 0 && branch > fetch && remote > branch &&
    hash > remote && launch > hash, 'Hol- und SHA-Pruefung muss vor Electron liegen');
  assert.match(launcher, /if not defined REMOTESHA \(/);
  assert.match(launcher, /if errorlevel 1 goto fehlgeschlagen/);
});

test('Redion-Live prueft Node >=22.18 vor npm ci', () => {
  const version = live.indexOf('major===22&&minor>=18');
  const install = live.indexOf('call npm ci');
  assert.ok(version >= 0 && version < install,
    'Nicht kompatible Node-Versionen muessen vor dem Build scheitern');
  assert.match(live, /if errorlevel 1 \([\s\S]*?Node\.js ist zu alt/);
});

test('Windows-Prueflauf zeigt Protokollhinweise statt sie auszufuehren', () => {
  assert.match(check, /^echo\s+Das vollstaendige Pruefprotokoll liegt/m);
  assert.doesNotMatch(check, /^\s+Das vollstaendige Pruefprotokoll liegt/m);
  assert.match(check, /schaltplan-protokoll\.mjs --where/);
});
