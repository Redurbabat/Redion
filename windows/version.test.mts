import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Versionsnummern in Web, Windows, npm und Changelog stimmen überein', () => {
  const web = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const win = JSON.parse(fs.readFileSync(path.join(root, 'windows/package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const json = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  const markdown = fs.readFileSync(path.join(root, 'version.md'), 'utf8');
  const version = web.version;
  assert.match(version, /^20\d{2}\.\d+\.\d+$/);
  assert.equal(win.version, version, 'installierte EXE-Version');
  assert.equal(lock.version, version, 'npm-Lockfile');
  assert.equal(lock.packages[''].version, version, 'Root-Paket im Lockfile');
  assert.equal(json.version, version, 'Version im Redion-Menü');
  assert.match(json.datum, /^20\d{2}-\d{2}-\d{2}$/);
  assert.ok(json.status?.length > 4);
  assert.ok(Array.isArray(json.aenderungen) && json.aenderungen.length > 0);
  assert.ok(json.aenderungen.every(v => typeof v === 'string' && v.length > 8));
  assert.ok(markdown.includes('## ' + version), 'version.md enthält einen Eintrag');
  assert.ok(markdown.indexOf('## ' + version) < markdown.indexOf('## 2026.8.3'),
    'neueste Version zuerst');
  assert.ok(markdown.includes(json.datum.split('-').reverse().join('.')) ||
    markdown.includes('31. Oktober 2026'), 'Datum erscheint im Versionsverlauf');
});
