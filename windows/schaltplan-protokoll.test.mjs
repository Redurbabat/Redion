/* Regression der Schaltplan-Protokollierung – keine Redion-App erforderlich.
 * Hier wird der Helfer ALS ECHTER KINDPROZESS gestartet und das Testprotokoll
 * in einem temporären Benutzerordner gehalten; keine echten Logs überschreiben.
 *
 *   node --test windows/schaltplan-protokoll.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const helper = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schaltplan-protokoll.mjs');

test('Schaltplan-Protokoll: echte Prozesse, Fehlercode und getrennte Ausgaben', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-schaltplan-log-'));
  const log = path.join(home, 'Redion-Schaltplan-Pruefung.log');
  const environment = { ...process.env, HOME: home, USERPROFILE: home };
  const run = (...args) => spawnSync(process.execPath, [helper, ...args], {
    env: environment, encoding: 'utf8', timeout: 15_000
  });
  try {
    const start = run('--start');
    assert.equal(start.status, 0, start.stderr);
    assert.ok(fs.existsSync(log), 'Die Logdatei muss angelegt sein');
    assert.match(fs.readFileSync(log, 'utf8'), /REDION-SCHALTPLAN-PRUEFUNG/);

    const success = run('--', 'node', '-e',
      'console.log("SCHALTPLAN_OK");console.error("SCHALTPLAN_STDERR")');
    assert.equal(success.status, 0, success.stderr);
    assert.match(success.stdout, /SCHALTPLAN_OK/);
    const afterSuccess = fs.readFileSync(log, 'utf8');
    assert.match(afterSuccess, /SCHALTPLAN_OK/);
    assert.match(afterSuccess, /SCHALTPLAN_STDERR/);
    assert.match(afterSuccess, /Ergebnis: BESTANDEN/);

    const failed = run('--', 'node', '-e', 'process.exit(7)');
    assert.equal(failed.status, 1, 'Fehler des Unterprozesses muss an .bat weitergereicht werden');
    assert.match(fs.readFileSync(log, 'utf8'), /Ergebnis: FEHLER \(Exit 7\)/);

    const forbidden = run('--', 'curl', 'https://example.invalid');
    assert.equal(forbidden.status, 2, 'Nur die freigegebenen lokalen Werkzeuge starten');

    const where = run('--where');
    assert.equal(where.status, 0);
    assert.equal(where.stdout.trim(), log);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
