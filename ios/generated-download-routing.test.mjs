/*
 * Native Exporte dürfen die Website nicht verändern.
 * Prüft die tatsächlich von Redion geladene generierte JavaScript-Ausgabe,
 * nicht eine Abschrift der beiden Download-Funktionen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readFunction(filename, name) {
  const source = fs.readFileSync(path.join(root, filename), 'utf8');
  const start = source.indexOf('const ' + name + ' = async (blob, name) => {');
  assert.ok(start >= 0, name + ': generierter async Export fehlt in ' + filename);
  const end = source.indexOf('\n    };', start);
  assert.ok(end > start, 'Funktionsende nicht gefunden: ' + name);
  return source.slice(start, end + '\n    };'.length);
}

function harness(filename, name, native = null) {
  const links = [];
  const toasts = [];
  const urls = [];
  const context = {
    Blob,
    Error,
    URL: {
      createObjectURL: blob => { urls.push(blob); return 'blob:mock'; },
      revokeObjectURL: () => {}
    },
    document: {
      createElement(tag) {
        assert.equal(tag, 'a');
        const anchor = {
          click() { links.push({href: anchor.href, download: anchor.download}); },
          remove() { /* keine DOM-Aenderung */ },
          style: {}
        };
        return anchor;
      },
      body: { appendChild() { /* keine DOM-Aenderung */ } }
    },
    UI: { toast: message => toasts.push(message) },
    setTimeout: () => 1
  };
  context.globalThis = context;
  const sandbox = vm.createContext(context);
  sandbox.globalThis.RedionNativeDateien = native;
  const exporter = vm.runInContext(readFunction(filename, name) + '\n' + name, sandbox);
  return {exporter, links, toasts, urls};
}

const pdf = 'quell/bereiche/pdf/document-mode.js';
const office = 'quell/bereiche/dateien/ausgeben.js';

for (const [filename, name, extension] of [
  [pdf, 'herunterladen', 'pdf'],
  [office, 'laden', 'docx']
]) {
  test(filename + ': Website verwendet weiterhin denselben Blob-Download', async () => {
    const ctx = harness(filename, name);
    const blob = new Blob(['Redion unveraendert']);
    assert.equal(await ctx.exporter(blob, 'Dokument.' + extension), true);
    assert.equal(ctx.urls.length, 1);
    assert.equal(ctx.urls[0], blob);
    assert.equal(ctx.links.length, 1);
    assert.equal(ctx.links[0].href, 'blob:mock');
    assert.equal(ctx.links[0].download, 'Dokument.' + extension);
  });

  test(filename + ': iOS nutzt die native Datei-Bruecke statt Blob-URL', async () => {
    const writes = [];
    const ctx = harness(filename, name, {
      async speichern(blob, filename) { writes.push({blob, filename}); }
    });
    const blob = new Blob([Uint8Array.from([0, 255, 80, 68, 70])]);
    assert.equal(await ctx.exporter(blob, 'iOS.' + extension), true);
    assert.deepEqual(writes, [{blob, filename: 'iOS.' + extension}]);
    assert.equal(ctx.links.length, 0);
    assert.equal(ctx.urls.length, 0);
  });

  test(filename + ': native Fehler werden angezeigt, nicht als Erfolg verbucht', async () => {
    const ctx = harness(filename, name, {
      async speichern() { throw new Error('Kein Speicherplatz'); }
    });
    assert.equal(await ctx.exporter(new Blob(['test']), 'fail.' + extension), false);
    assert.equal(ctx.links.length, 0);
    assert.equal(ctx.urls.length, 0);
    assert.ok(ctx.toasts.some(t => t.includes('Kein Speicherplatz')));
  });
}

test('Die PDF-Oberflaeche wartet auf den Export, bevor sie "gesichert" sagt', () => {
  const compiled = fs.readFileSync(path.join(root, pdf), 'utf8');
  const image = compiled.slice(compiled.indexOf("if (action === 'page-export-image')"));
  assert.match(image.slice(0, 1200), /await herunterladen\(/);
  assert.match(image.slice(0, 1200), /if \(gespeichert\)/);
  const documentExport = compiled.slice(compiled.indexOf("if (action === 'export-pdf')"));
  assert.match(documentExport.slice(0, 2300), /await herunterladen\(/);
  assert.match(documentExport.slice(0, 2300), /if \(gespeichert\)/);
  assert.match(documentExport.slice(0, 2300), /\.finally\(/);
});

test('Office-/Archiv-Funktionen warten ebenfalls auf die Dateiausgabe', () => {
  const compiled = fs.readFileSync(path.join(root, office), 'utf8');
  const calls = compiled.match(/await laden\(blob,/g) ?? [];
  assert.equal(calls.length, 7);
  assert.ok(!compiled.includes('\n        laden(blob,'));
  assert.ok(!compiled.includes('\n            laden(blob,'));
});
