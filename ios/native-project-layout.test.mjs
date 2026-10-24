/*
 * Regression gegen Codemagic [error] ios platform already exists.
 * Redion hat seit langem EIGENE Werkzeuge unter ios/. Capacitor braucht
 * darum einen anderen Zielordner. Keine Loeschbefehle im Build erfinden!
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const nativeRelative = 'build/ios-capacitor';
const project = nativeRelative + '/App/App.xcodeproj';
const delegate = nativeRelative + '/App/App/AppDelegate.swift';

test('Capacitor 8 nutzt einen eigenen, generierten iOS-Pfad', () => {
  assert.equal(config.appId, 'ch.redurbabat.redion');
  assert.equal(config.appName, 'Redion');
  assert.equal(config.webDir, 'www');
  assert.equal(config.ios?.path, nativeRelative);
  assert.ok(nativeRelative.startsWith('build/'), 'Natives Projekt muss im Build-Ordner liegen.');
  assert.notEqual(config.ios.path, 'ios', 'Redions ios/-Quelldateien nie ueberschreiben.');
});

test('Redions native Quellen werden weder entfernt noch als Xcode-Projekt benutzt', () => {
  for (const file of [
    'ios/native-sicherung.ts',
    'ios/privacy-shield.swift',
    'ios/install-privacy-shield.mjs',
    'ios/vorbereiten.mjs',
    'ios/vergleiche-webstand.mjs'
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), 'Redion-Quelle fehlt: ' + file);
  }
  assert.match(workflow, /test -f ios\/native-sicherung\.ts/);
  assert.match(workflow, /test -f ios\/privacy-shield\.swift/);
  assert.match(workflow, /test ! -e build\/ios-capacitor/);
  assert.doesNotMatch(workflow, /(?:^|\n)\s*(?:rm|rmdir)\s+[^\n]*\bios(?:\/|\s|$)/,
    'Build darf ios/ nicht loeschen.');
});

test('Capacitor add/sync legt ein separates Projekt an und prueft das Ergebnis', () => {
  const add = workflow.indexOf('npx cap add ios --packagemanager SPM');
  const sync = workflow.indexOf('npx cap sync ios');
  const check = workflow.indexOf('test -f ' + delegate);
  assert.ok(add > 0 && sync > add && check > sync, 'Erzeugung, Sync, Kontrolle fehlen.');
  assert.match(workflow, /test -f build\/ios-capacitor\/App\/App\.xcodeproj\/project\.pbxproj/);
});

test('Datenschutz, Dateifreigabe, Symbol und xcodebuild nutzen dasselbe native Projekt', () => {
  assert.match(workflow, /grep -q 'RedionPrivacyShield\.start\(\)' build\/ios-capacitor\/App\/App\/AppDelegate\.swift/);
  assert.match(workflow, /PLIST="build\/ios-capacitor\/App\/App\/Info\.plist"/);
  assert.match(workflow, /ICONSET="build\/ios-capacitor\/App\/App\/Assets\.xcassets\/AppIcon\.appiconset"/);
  assert.ok(workflow.includes('-project ' + project));
  assert.doesNotMatch(workflow, /(?:^|[ "'=])ios\/App\//,
    'Alter Xcode-Pfad wuerde nun ein falsches Projekt ansprechen.');
  const installer = fs.readFileSync(path.join(root, 'ios/install-privacy-shield.mjs'), 'utf8');
  assert.match(installer, /nativeAppDelegatePath\(root, config\)/);
  assert.match(installer, /config\.ios\.path/);
});

test('Nur das generierte Xcode-Verzeichnis ist ignoriert, nicht ios/', () => {
  assert.match(ignore, /^\/build\/ios-capacitor\/$/m);
  assert.doesNotMatch(ignore, /^ios\/$/m);
  assert.doesNotMatch(ignore, /^\/ios\/$/m);
});
