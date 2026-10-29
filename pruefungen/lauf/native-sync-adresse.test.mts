/* Native Windows: nur explizite HTTPS-Sync-Adressen und keine Token-Lecks. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const code = fs.readFileSync(path.join(REPO, 'quell/kern/abgleich/maschine.js'), 'utf8');
const ui = fs.readFileSync(path.join(REPO, 'quell/bereiche/verbinden/ansicht/wolke.js'), 'utf8');

function app(einstellungen: Record<string, unknown> = {},
             protokoll = 'redion-local:', ursprung = 'null') {
  const daten = new Map(Object.entries(einstellungen));
  const fenster: Record<string, any> = {};
  const store = {
    getMeta: (name: string, vorgabe: unknown) =>
      daten.has(name) ? daten.get(name) : vorgabe,
    setMeta: (name: string, wert: unknown) => { daten.set(name, wert); }
  };
  vm.runInNewContext(code, {
    Store: store, window: fenster, URL,
    location: { protocol: protokoll, origin: ursprung },
    navigator: { userAgent: 'Windows', platform: 'Win32' }
  }, { timeout: 1500 });
  return { wolke: fenster.Wolke, daten };
}

test('Windows app never mistakes redion-local origin for remote sync server', async () => {
  const { wolke } = app();
  assert.equal(wolke.adresse(), '');
  await assert.rejects(() => wolke.ruf('/api/stand'), /Kein sicherer Redion-Server/);
});

test('explicit HTTPS address is normalized to exact server origin', () => {
  const { wolke } = app({ wolkeAdresse: 'https://sync.example.org/' });
  assert.equal(wolke.adresse(), 'https://sync.example.org');
  assert.equal(wolke.serverAdressePruefen('https://sync.example.org:443/'),
    'https://sync.example.org');
});

test('native app rejects HTTP, local protocols and credential-bearing URLs', () => {
  const { wolke } = app();
  const schlechte = [
    'http://sync.example.org', 'http://localhost:8795',
    'file:///C:/Redion', 'redion-local://app/index.html',
    'https://user:password@sync.example.org',
    'https://sync.example.org/subpath',
    'https://sync.example.org/?token=secret',
    'https://sync.example.org/#fragment',
    'javascript:alert(1)', 'https://',
    ''
  ];
  for (const wert of schlechte)
    assert.equal(wolke.serverAdressePruefen(wert), '', wert);
});

test('an invalid stored server cannot receive credentials', async () => {
  const { wolke } = app({ wolkeAdresse: 'http://unsafe.example.org', wolkeToken: 'secret' });
  assert.equal(wolke.adresse(), '');
  await assert.rejects(() => wolke.ruf('/konto/ich'), /Kein sicherer Redion-Server/);
});

test('web still uses same-origin backend and localhost test server', () => {
  const web = app({}, 'https:', 'https://redion.example.org');
  assert.equal(web.wolke.adresse(), 'https://redion.example.org');
  const dev = app({}, 'http:', 'http://localhost:8795');
  assert.equal(dev.wolke.adresse(), 'http://localhost:8795');
  assert.equal(dev.wolke.serverAdressePruefen('http://localhost:8795'),
    'http://localhost:8795');
  assert.equal(dev.wolke.serverAdressePruefen('http://outside.example.org'), '');
});

test('UI never changes a server while the old bearer token is active', () => {
  assert.match(ui, /Wolke\.angemeldet\(\) && Wolke\.adresse\(\) !== ziel/);
  assert.match(ui, /Bitte zuerst von der Wolke abmelden/);
  assert.match(ui, /Offline, kein Sync-Server verbunden/);
});
