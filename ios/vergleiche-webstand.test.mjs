import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { vergleicheWebstand } from './vergleiche-webstand.mjs';

const NATIVE_EINBINDUNG = '<script src="redion-native-sicherung.js"></script>\n';
const WEBSITE = '<!doctype html>\n<html><head></head><body>Redion</body></html>\n';
const so = (basis, name, inhalt) => {
  const ziel = path.join(basis, name);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, inhalt);
};
const testfall = (pruefung) => {
  const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-paritaet-'));
  try {
    so(basis, 'index.html', WEBSITE);
    so(basis, 'sw.js', 'offline');
    so(basis, 'quell/start.js', 'const App = 1;');
    so(basis, 'quell/schale/stil/grund.css', 'body{margin:0}');
    so(basis, 'oeffentlich/icons/icon.png', Buffer.from([0, 255, 127]));
    so(basis, 'www/index.html', WEBSITE.replace('</body>',
      NATIVE_EINBINDUNG + '</body>'));
    so(basis, 'www/sw.js', 'offline');
    so(basis, 'www/quell/start.js', 'const App = 1;');
    so(basis, 'www/quell/schale/stil/grund.css', 'body{margin:0}');
    so(basis, 'www/oeffentlich/icons/icon.png', Buffer.from([0, 255, 127]));
    so(basis, 'www/redion-native-sicherung.js', '(function(){})();');
    pruefung(basis);
  } finally {
    fs.rmSync(basis, {recursive: true, force: true});
  }
};

test('iPhone- und Website-Paket haben identische Web-Dateien', () => {
  testfall(basis => {
    const bericht = vergleicheWebstand(basis);
    assert.equal(bericht.ergebnis, 'identischer Webstand');
    assert.equal(bericht.webDateien, 5);
    assert.match(bericht.indexSha256, /^[0-9a-f]{64}$/);
  });
});

test('iOS darf die Website nicht unbemerkt verändern', () => {
  testfall(basis => {
    so(basis, 'www/quell/start.js', 'const App = 2;');
    assert.throws(() => vergleicheWebstand(basis), /abweichende Inhalte: quell\/start.js/);
  });
});

test('fehlende Dateien verhindern den Build', () => {
  testfall(basis => {
    fs.unlinkSync(path.join(basis, 'www/sw.js'));
    assert.throws(() => vergleicheWebstand(basis), /Fehlend: sw.js/);
  });
});

test('unbekannte iOS-Webdateien verhindern den Build', () => {
  testfall(basis => {
    so(basis, 'www/anderes.html', 'anderer Inhalt');
    assert.throws(() => vergleicheWebstand(basis), /zusaetzlich: anderes.html/);
  });
});

test('native Einbindung darf nur einmal und nur in www vorkommen', () => {
  testfall(basis => {
    let html = fs.readFileSync(path.join(basis, 'www/index.html'), 'utf8');
    so(basis, 'www/index.html', html.replace('</body>', NATIVE_EINBINDUNG + '</body>'));
    assert.throws(() => vergleicheWebstand(basis), /nicht genau einmal/);
  });
  testfall(basis => {
    so(basis, 'redion-native-sicherung.js', '/* zu viel */');
    assert.throws(() => vergleicheWebstand(basis), /Website-Stammverzeichnis/);
  });
});
