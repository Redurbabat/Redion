import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNativeFileExporter, safeFileName } from './native-file-export.mjs';

function mockNative({ failAppendAt = 0, wrongSize = false, shareFails = false } = {}) {
  const files = new Map();
  const calls = [];
  let appends = 0;
  const filesystem = {
    async mkdir({ path }) { assert.ok(['Exporte', 'Backups'].includes(path)); },
    async writeFile({ path, data }) {
      assert.equal(data, ''); files.set(path, Buffer.alloc(0));
    },
    async appendFile({ path, data }) {
      appends++;
      if (appends === failAppendAt) throw new Error('Speicher voll');
      assert.ok(files.has(path), 'Es gibt eine Datei zum Anhaengen');
      files.set(path, Buffer.concat([files.get(path), Buffer.from(data, 'base64')]));
    },
    async stat({ path }) { return { size: files.get(path).length + (wrongSize ? 1 : 0) }; },
    async rename({ from, to }) { files.set(to, files.get(from)); files.delete(from); },
    async deleteFile({ path }) { files.delete(path); },
    async getUri({ path }) { return { uri: 'file:///Redion/' + path }; }
  };
  const share = { async share(options) {
    calls.push(options);
    if (shareFails) throw new Error('User cancelled');
  } };
  const save = createNativeFileExporter({
    filesystem, share, directory: 'DOCUMENTS',
    createId: () => '12345678-1234-1234-1234-123456789abc',
    now: () => new Date('2026-10-24T13:00:00.000Z')
  });
  return { save, files, calls, getAppends: () => appends };
}

test('PDF kommt binaer und unveraendert in Dateien-App und Share Sheet an', async () => {
  const mock = mockNative();
  const bytes = Uint8Array.from({ length: 256 * 1024 + 17 }, (_, n) => n % 251);
  const result = await mock.save(new Blob([bytes]), 'Bericht.pdf');
  assert.equal(result.bytes, bytes.length);
  assert.equal(result.shareSheetOpened, true);
  assert.ok(result.path.startsWith('Exporte/Bericht-'));
  assert.ok(result.path.endsWith('.pdf'));
  assert.deepEqual(mock.files.get(result.path), Buffer.from(bytes));
  assert.equal(mock.getAppends(), 2, 'Stuecke werden getrennt an iOS geschickt');
  assert.deepEqual(mock.calls[0].files, ['file:///Redion/' + result.path]);
  assert.ok(!('url' in mock.calls[0]), 'Die Datei wird nicht als Text-URL geteilt');
  assert.equal(mock.files.size, 1, 'Keine .teil-Datei bleibt liegen');
});

test('Backup kann in den separaten Backups-Ordner geschrieben werden', async () => {
  const mock = mockNative();
  const result = await mock.save(new Blob(['{"ok":true}']), 'redion-sicherung-2026-10-24.json', 'Backups');
  assert.match(result.path, /^Backups\/redion-sicherung-2026-10-24-.*\.json$/);
});

test('Dateiname ist niemals ein Verzeichnispfad', () => {
  assert.equal(safeFileName('../../Geheim.pdf'), 'Geheim.pdf');
  assert.equal(safeFileName('C:\\Windows\\Bericht.docx'), 'Bericht.docx');
  assert.equal(safeFileName('..'), 'Datei');
  assert.equal(safeFileName(''), 'Datei');
  assert.equal(safeFileName('bild?.png'), 'bild-.png');
});

test('Abgebrochenes Teilen laesst die gepruefte lokale Datei erhalten', async () => {
  const mock = mockNative({ shareFails: true });
  const result = await mock.save(new Blob(['Inhalt']), 'Lernen.txt');
  assert.equal(result.shareSheetOpened, false);
  assert.equal(mock.files.get(result.path).toString('utf8'), 'Inhalt');
});

test('Unterbrochener Schreibvorgang loescht nur die temp-Datei', async () => {
  const mock = mockNative({ failAppendAt: 2 });
  const bytes = new Uint8Array(256 * 1024 + 20);
  await assert.rejects(mock.save(new Blob([bytes]), 'gross.bin'), /Speicher voll/);
  assert.equal(mock.files.size, 0);
  assert.equal(mock.calls.length, 0);
});

test('Falsche Bytezahl darf niemals als fertiger Export gelten', async () => {
  const mock = mockNative({ wrongSize: true });
  await assert.rejects(mock.save(new Blob(['test']), 'test.txt'), /Datei unvollstaendig/);
  assert.equal(mock.files.size, 0);
});

test('Leere Datei und fremde Zielordner werden nicht geschrieben', async () => {
  const mock = mockNative();
  await assert.rejects(mock.save(new Blob([]), 'leer.pdf'), /leer/);
  await assert.rejects(mock.save(new Blob(['x']), 'test', '../fremd'), /Unbekannter Zielordner/);
  assert.equal(mock.files.size, 0);
});
