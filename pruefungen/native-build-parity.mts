import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compareWindowsWeb } from '../windows/compare-web.mts';
import { extractBuildSteps } from '../ios/run-codemagic.mts';
import { inspectSyncSetup } from '../skripte/sync-readiness.mts';

test('Windows packaging fails on missing, altered and stale Web assets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-parity-'));
  const source = path.join(root, 'source'), target = path.join(root, 'package');
  try {
    fs.mkdirSync(path.join(source, 'quell'), { recursive: true });
    fs.writeFileSync(path.join(source, 'index.html'), 'REDION');
    fs.writeFileSync(path.join(source, 'sw.js'), 'OFFLINE');
    fs.writeFileSync(path.join(source, 'version.json'), '{"version":"test"}');
    fs.writeFileSync(path.join(source, 'version.md'), 'Nur synthetische Testversion');
    fs.writeFileSync(path.join(source, 'quell/start.js'), 'START');
    fs.cpSync(source, target, { recursive: true });
    assert.equal(compareWindowsWeb(source, target).files.length, 5);
    fs.unlinkSync(path.join(target, 'version.json'));
    assert.throws(() => compareWindowsWeb(source, target), /fehlende/);
    fs.writeFileSync(path.join(target, 'version.json'), '{"version":"test"}');
    fs.writeFileSync(path.join(target, 'quell/stale.js'), 'OLD');
    assert.throws(() => compareWindowsWeb(source, target), /veraltete/);
    fs.unlinkSync(path.join(target, 'quell/stale.js'));
    fs.writeFileSync(path.join(target, 'index.html'), 'CHANGED');
    assert.throws(() => compareWindowsWeb(source, target), /Abweichender/);
  } finally { fs.rmSync(root, { recursive: true }); }
});

test('manual GitHub IPA build uses the complete Codemagic sequence without replacing identity', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const yaml = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
  const steps = extractBuildSteps(yaml);
  assert.ok(steps.length > 8);
  assert.ok(steps.some(step => step.script.includes('ios/vergleiche-webstand.mjs')));
  assert.ok(steps.some(step => step.script.includes('ios/install-open-documents.mts')));
  assert.ok(steps.at(-1)?.script.includes('Redion-unsigned.ipa'));
  assert.ok(steps.every(step => !step.script.includes('cat > capacitor.config.json')));
  assert.throws(() => extractBuildSteps(yaml.replace('    scripts:', '    changed:')));
  assert.throws(() => extractBuildSteps(yaml.replace('    artifacts:', '    changed:')));
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ios-ipa.yml'), 'utf8');
  assert.match(workflow, /node ios\/run-codemagic.mts/);
  assert.doesNotMatch(workflow, /cat > capacitor.config.json|project ios\/App/);
});

test('sync preflight never confuses commented bindings or a local file with live readiness', () => {
  const config = '# [[d1_databases]]\n# binding = "DB"\n# database_id = "11111111-2222-4333-8444-555555555555"';
  const excluded = '/windows/\n/ios/\n/build/\n/www/';
  const missing = inspectSyncSetup(config, excluded);
  assert.equal(missing.databaseConfigured, false); assert.equal(missing.attachmentsConfigured, false);
  assert.equal(missing.nativeBuildsExcluded, true); assert.equal(missing.liveServiceVerified, false);
  const enabled = inspectSyncSetup(config.replace(/^# /gm, '') + '\n[[r2_buckets]]\nbinding = "R2"\nbucket_name = "redion-dateien"\n[vars]\nTOR = "offen"', excluded);
  assert.equal(enabled.databaseConfigured, true); assert.equal(enabled.attachmentsConfigured, true);
  assert.equal(enabled.unsafeOpenGate, true); assert.equal(enabled.nativeAuthenticationVerified, false);
  assert.equal(inspectSyncSetup(config, '/windows/').nativeBuildsExcluded, false);
});
