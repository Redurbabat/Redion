/*
 * Ausschliesslich beim Codemagic-iOS-Build ausgeführt.
 * Das Web-/PWA-index.html bleibt unverändert und ohne native Abhängigkeiten.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
assert.equal(cfg.appId, 'ch.redurbabat.redion',
  'Die App-ID darf nicht unbemerkt wechseln: sonst sieht iOS ein anderes Datenverzeichnis.');
assert.equal(cfg.webDir, 'www');

const index = cfg.webDir + '/index.html';
const html = fs.readFileSync(index, 'utf8');
const script = '<script src="redion-native-sicherung.js"></script>';
if (!html.includes('</body>') || html.includes(script)) {
  throw new Error('Native Brücke konnte nicht genau einmal in die iOS-App eingebaut werden.');
}
if (!fs.existsSync(cfg.webDir + '/redion-native-sicherung.js')) {
  throw new Error('Native Brücke fehlt: vorher ios/native-sicherung.ts bauen.');
}
fs.writeFileSync(index, html.replace('</body>', script + '\n</body>'));
