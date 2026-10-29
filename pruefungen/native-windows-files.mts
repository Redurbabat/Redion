import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { NativeFiles, trustedSender, safeExportName } = require('../windows/generated/files.cjs');
// Bewusste Gegenprobe: ohne Vollständigkeitsprüfung muss dieser Lauf rot sein.
if (process.env.REDION_NATIVE_TEST_MUTANT === '1') NativeFiles.prototype.commit = async () => true;

test('native file capabilities read exact bytes, never arbitrary paths, and expire', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-native-files-'));
  const files = new NativeFiles();
  try {
    const content = Buffer.alloc(2 * 1024 * 1024 + 7, 73);
    const source = path.join(root, 'Prüfung 📚.pdf');
    await fs.writeFile(source, content);
    const id = await files.offer(source);
    assert.equal(files.pending()[0].name, 'Prüfung 📚.pdf');
    assert.equal('path' in files.pending()[0], false);
    await assert.rejects(files.read(source, 0));
    await assert.rejects(files.read(id, 1));
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < content.length) {
      const data = await files.read(id, size);
      assert.ok(data.length <= 1024 * 1024);
      chunks.push(data); size += data.length;
    }
    assert.deepEqual(Buffer.concat(chunks), content);
    await files.release(id);
    await assert.rejects(files.read(id, 0));
    assert.deepEqual(files.pending(), []);
    assert.equal(await files.offer(path.join(root, 'private.exe')), null);
    assert.deepEqual(await fs.readFile(source), content);
  } finally { await files.close(); await fs.rm(root, { recursive: true }); }
});

test('atomic exports preserve old targets on partial writes, cancellation and bad sizes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-native-save-'));
  const files = new NativeFiles();
  const target = path.join(root, 'backup.redion');
  try {
    await fs.writeFile(target, 'ORIGINAL');
    const id = await files.begin(target, 5);
    await files.write(id, Uint8Array.of(1, 2));
    await assert.rejects(files.commit(id));
    assert.equal(await fs.readFile(target, 'utf8'), 'ORIGINAL');
    await assert.rejects(files.write(id, new Uint8Array(5)));
    await files.cancel(id);
    assert.deepEqual(await fs.readdir(root), ['backup.redion']);
    const next = await files.begin(target, 3);
    await files.write(next, Uint8Array.of(4, 5, 6));
    assert.equal(await files.commit(next), true);
    assert.deepEqual(await fs.readFile(target), Buffer.from([4, 5, 6]));
    await assert.rejects(files.write(next, Uint8Array.of(9)));
    await assert.rejects(files.begin('relative.redion', 1));
    await assert.rejects(files.begin(target, -1));
  } finally { await files.close(); await fs.rm(root, { recursive: true }); }
});

test('changed source is rejected and only exact local top frame receives capabilities', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-native-security-'));
  const files = new NativeFiles();
  try {
    const source = path.join(root, 'note.txt');
    await fs.writeFile(source, 'before');
    const id = await files.offer(source);
    await fs.writeFile(source, 'after with different length');
    await assert.rejects(files.read(id, 0));
    const frame = { url: 'redion-local://app/index.html' };
    const contents = { mainFrame: frame };
    assert.equal(trustedSender({ sender: contents, senderFrame: frame }, contents), true);
    frame.url = 'redion-local://app/index.html#dokumente';
    assert.equal(trustedSender({ sender: contents, senderFrame: frame }, contents), true);
    for (const url of ['https://redion.ch/', 'file:///x', 'redion-local://app/other.html', 'redion-local://app/index.html?x=1']) {
      frame.url = url;
      assert.equal(trustedSender({ sender: contents, senderFrame: frame }, contents), false);
    }
    frame.url = 'redion-local://app/index.html';
    assert.equal(trustedSender({ sender: {}, senderFrame: frame }, contents), false);
    assert.equal(trustedSender({ sender: contents, senderFrame: { ...frame } }, contents), false);
    for (const name of ['../a.redion', 'C:\\secret', 'CON.pdf', '.hidden', 'bad\n.pdf', 'end.']) assert.throws(() => safeExportName(name));
    assert.equal(safeExportName('Meine Notizen 📚.redion'), 'Meine Notizen 📚.redion');
  } finally { await files.close(); await fs.rm(root, { recursive: true }); }
});
