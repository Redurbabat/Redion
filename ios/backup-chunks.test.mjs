import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basis64Scheiben } from './backup-chunks.mjs';

async function runde(bytes, scheibe) {
  const teile = [];
  for await (const basis64 of basis64Scheiben(new Blob([bytes]), scheibe)) {
    teile.push(Buffer.from(basis64, 'base64'));
  }
  assert.deepEqual(Buffer.concat(teile), Buffer.from(bytes));
}

test('Leeres Archiv bleibt leer', async () => {
  await runde(new Uint8Array(0), 256 * 1024);
});

test('ZIP-Binärdaten bleiben bei beliebiger Chunk-Grenze erhalten', async () => {
  const bytes = Uint8Array.from({length: 1025}, (_, i) => i % 256);
  for (const groesse of [1, 2, 3, 7, 255, 256, 1024]) {
    await runde(bytes, groesse);
  }
});

test('Grosses Archiv wird vollständig in kleine Scheiben geteilt', async () => {
  const bytes = Uint8Array.from({length: 3 * 1024 * 1024 + 13}, (_, i) => i % 251);
  await runde(bytes, 256 * 1024);
});

test('Nicht unterstützte Werte werden abgelehnt', async () => {
  await assert.rejects(async () => {
    for await (const _ of basis64Scheiben(new Blob(), 0)) { /* leer */ }
  }, RangeError);
  await assert.rejects(async () => {
    for await (const _ of basis64Scheiben('keine Datei')) { /* leer */ }
  }, TypeError);
});
