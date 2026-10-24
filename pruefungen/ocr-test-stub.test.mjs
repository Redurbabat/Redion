import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createTesseractStub, withTestPath, WINDOWS_CSHARP } from './ocr-test-stub.mjs';

test('PATH verwendet unter Windows exakt einen case-insensitiven Schlüssel', () => {
  const result = withTestPath({ Path: 'C:\\Windows', PATH: 'falsch', OTHER: 'test' }, 'D:\\test');
  assert.equal(Object.keys(result).filter(k => k.toLowerCase() === 'path').length, 1);
  assert.equal(Object.entries(result).find(([k]) => k.toLowerCase() === 'path')?.[1], 'D:\\test');
  assert.equal(result.OTHER, 'test');
});

test('Unix: das Ersatzprogramm liest echte Bild-Bytes ohne Shell', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-ocr-linux-'));
  try {
    const stub = await createTesseractStub(directory, { platform: 'linux' });
    const image = path.join(directory, 'bild mit leerzeichen.png');
    await fs.writeFile(image, Buffer.from([1, 2, 3, 4, 5, 6, 7]));
    const output = execFileSync(stub, [image, 'stdout', '-l', 'deu+eng'],
      { encoding: 'utf8' });
    assert.match(output, /Verteiler UV3/);
    assert.match(output, /Sprache deu\+eng/);
    assert.match(output, /Bytes 7/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('Windows: der Compiler erhält Dateipfade nur via Umgebungsvariablen', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-ocr-win-'));
  let called = 0;
  try {
    const stub = await createTesseractStub(directory, {
      platform: 'win32',
      compiler(command, args, options) {
        called += 1;
        assert.equal(command, 'powershell.exe');
        assert.ok(args.includes('-NonInteractive'));
        const instruction = args[args.length - 1];
        assert.ok(instruction.includes('$env:REDION_OCR_TEST_SOURCE'));
        assert.ok(instruction.includes('$env:REDION_OCR_TEST_PROGRAM'));
        assert.ok(!instruction.includes(directory), 'Temppfad darf kein PowerShell-Code sein');
        assert.equal(path.basename(options.env.REDION_OCR_TEST_SOURCE), 'tesseract-stub.cs');
        assert.equal(path.basename(options.env.REDION_OCR_TEST_PROGRAM), 'tesseract.exe');
        fsSync.writeFileSync(options.env.REDION_OCR_TEST_PROGRAM, Buffer.from('MZ'));
      }
    });
    assert.equal(called, 1);
    assert.equal(path.basename(stub), 'tesseract.exe');
    const source = await fs.readFile(path.join(directory, 'tesseract-stub.cs'), 'utf8');
    assert.equal(source, WINDOWS_CSHARP);
    assert.match(source, /File\.Exists\(image\)/);
    assert.match(source, /new FileInfo\(image\)\.Length/);
    assert.match(source, /tesseract 5\.9\.0/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('Windows: fehlgeschlagene Compiler-Ausgabe wird nicht als Test-Erfolg gewertet', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-ocr-fail-'));
  try {
    await assert.rejects(createTesseractStub(directory,
      { platform: 'win32', compiler() {} }), /keinen ausführbaren/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
