import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  workerBindings, assessSyncReadiness, readLocalReadiness, reportText
} from './sync-readiness.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const id = '12345678-1234-1234-1234-123456789abc';
const valid = `
name = "red-ion"
[assets]
run_worker_first = true

[[d1_databases]]
binding = "DB"
database_name = "redion"
database_id = "${id}"

[[r2_buckets]]
binding = "R2"
bucket_name = "redion-dateien"
`;
const available = () => true;

test('commented bindings (including old account UUIDs) are never active', () => {
  const toml = `
# [[d1_databases]]
# binding = "DB"
# database_name = "redion"
# database_id = "${id}"

[assets]
run_worker_first = true

# [[r2_buckets]]
# binding = "R2"
# bucket_name = "redion-dateien"
`;
  assert.deepEqual(workerBindings(toml), { d1_databases: [], r2_buckets: [] });
  const state = assessSyncReadiness({ toml, fileExists: available });
  assert.equal(state.checks.find(x => x.id === 'd1').ready, false);
  assert.equal(state.checks.find(x => x.id === 'r2').ready, false);
});

test('strictly require exactly one known D1 binding and one known R2', () => {
  const result = assessSyncReadiness({ toml: valid, fileExists: available });
  assert.equal(result.ready, true);
  assert.equal(result.checks.find(x => x.id === 'd1').ready, true);
  assert.equal(result.checks.find(x => x.id === 'r2').ready, true);
  const twice = assessSyncReadiness({ toml: valid + `
[[d1_databases]]
binding = "DB"
database_name = "redion"
database_id = "${id}"
`, fileExists: available });
  assert.equal(twice.checks.find(x => x.id === 'd1').ready, false);
  const broken = assessSyncReadiness({
    toml: valid.replace(id, 'HIER-DIE-ECHTE-KENNUNG-EINTRAGEN'),
    fileExists: available
  });
  assert.equal(broken.checks.find(x => x.id === 'd1').ready, false);
});

test('do not mistake comment hashes in quoted TOML for actual comments', () => {
  const blocks = workerBindings(valid.replace(
    'bucket_name = "redion-dateien"',
    'bucket_name = "redion#dateien" # comment'
  ));
  assert.equal(blocks.r2_buckets[0].bucket_name, 'redion#dateien');
  assert.equal(assessSyncReadiness({
    toml: valid.replace('bucket_name = "redion-dateien"', 'bucket_name = "wrong"'),
    fileExists: available
  }).checks.find(x => x.id === 'r2').ready, false);
});

test('native sync and iCloud need explicit implementation before ready', () => {
  const files = new Set([
    'server/schema.sql', 'server/cloudflare.ts', 'server/kern.ts',
    'server/dateien.ts', 'worker.ts', 'server/sicherheit/tor.ts',
    'ios/native-sicherung.ts', 'src/kern/abgleich/maschine.ts',
    'windows/main.cjs', 'windows/package.json'
  ]);
  const report = assessSyncReadiness({ toml: valid, fileExists: f => files.has(f) });
  assert.equal(report.checks.find(x => x.id === 'server').ready, true);
  assert.equal(report.checks.find(x => x.id === 'ios').ready, true);
  assert.equal(report.checks.find(x => x.id === 'windows').ready, true);
  assert.equal(report.checks.find(x => x.id === 'nativeApi').ready, false);
  assert.equal(report.checks.find(x => x.id === 'iphoneIcloud').ready, false);
  assert.equal(report.ready, false);
});

test('readiness checks actual current configuration, not historical comments', () => {
  const report = readLocalReadiness(root);
  assert.equal(report.checks.find(x => x.id === 'd1').ready, false);
  assert.equal(report.checks.find(x => x.id === 'r2').ready, false);
  assert.equal(report.checks.find(x => x.id === 'nativeApi').ready, false);
  assert.equal(report.checks.find(x => x.id === 'iphoneIcloud').ready, false);
  const message = reportText(report);
  assert.match(message, /Noch NICHT produktionsbereit/);
  assert.match(message, /npx wrangler whoami --json/);
  assert.doesNotMatch(message, /\b(?:CSC_KEY_PASSWORD|CF_API_TOKEN|GITHUB_TOKEN)=/);
});

test('JSON mode is machine-readable and never changes the repository', () => {
  const source = fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8');
  const argv = [path.join(here, 'sync-readiness.mjs'), '--json'];
  const result = spawnSync(process.execPath, argv, {
    encoding: 'utf8', cwd: root, timeout: 10_000
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ready, false);
  assert.ok(Array.isArray(parsed.checks));
  assert.equal(fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8'), source);
});

test('strict mode returns nonzero without touching Cloudflare or local user data', () => {
  const result = spawnSync(process.execPath, [
    path.join(here, 'sync-readiness.mjs'), '--strict'
  ], { encoding: 'utf8', cwd: root, timeout: 10_000 });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Es wurde nichts geändert/);
});

test('inspector is read-only by contract: no shell, fetch, mutation or deployment', () => {
  const source = fs.readFileSync(path.join(here, 'sync-readiness.mjs'), 'utf8');
  assert.doesNotMatch(source, /(?:spawnSync|execFile|execSync|child_process|\bfetch\s*\()/);
  assert.doesNotMatch(source, /(?:fs\.write|fs\.rm|fs\.unlink|fs\.rename|fs\.mkdir)/);
  assert.doesNotMatch(source, /wrangler (?:deploy|secret put|d1 create|r2 bucket create)/);
});
