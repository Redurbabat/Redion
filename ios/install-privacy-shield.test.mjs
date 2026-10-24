import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectPrivacyShield } from './install-privacy-shield.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const swift = fs.readFileSync(path.join(root, 'ios/privacy-shield.swift'), 'utf8');
const typicalDelegate = [
  'import UIKit',
  'import Capacitor',
  'class AppDelegate: UIResponder, UIApplicationDelegate {',
  '    var window: UIWindow?',
  '    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {',
  '        // Other Capacitor initialization',
  '        return true',
  '    }',
  '}',
  ''
].join('\n');

test('Datenschutzschirm ist in der generierten iOS-AppDelegate eingebaut', () => {
  const result = injectPrivacyShield(typicalDelegate, swift);
  assert.match(result, /RedionPrivacyShield\.start\(\)/);
  assert.match(result, /private final class RedionPrivacyShield: NSObject/);
  assert.match(result, /return true/);
  assert.match(result, /import Capacitor/);
  assert.equal(result.split('RedionPrivacyShield.start()').length, 2);
});

test('Die Einbindung ist bewusst nur einmal erlaubt', () => {
  const once = injectPrivacyShield(typicalDelegate, swift);
  assert.throws(() => injectPrivacyShield(once, swift), /bereits eingebunden/);
});

test('Ein unerwartetes Capacitor-Template wird nicht blind bearbeitet', () => {
  assert.throws(() => injectPrivacyShield('import UIKit\n', swift), /nicht eindeutig gefunden/);
  assert.throws(() => injectPrivacyShield(typicalDelegate, ''), /keine gültige Swift-Klasse/);
  assert.throws(() => injectPrivacyShield(typicalDelegate.replace('import UIKit', ''), swift), /UIKit/);
});

test('Nur native Lebenszyklusbenachrichtigungen verdecken Screenshots', () => {
  assert.match(swift, /UIApplication\.willResignActiveNotification/);
  assert.match(swift, /UIScene\.willDeactivateNotification/);
  assert.match(swift, /UIApplication\.didBecomeActiveNotification/);
  assert.match(swift, /UIScene\.didActivateNotification/);
  assert.match(swift, /UIColor\(red: 0\.09, green: 0\.10/);
  assert.match(swift, /covers\.removeAll\(\)/);
  assert.doesNotMatch(swift, /URLSession|http:|https:|UserDefaults|FaceID/);
});

test('Kein Webseiten-Skript, keine Änderung an index.html oder Capacitor-Konfiguration', () => {
  const script = fs.readFileSync(path.join(root, 'ios/install-privacy-shield.mjs'), 'utf8');
  assert.match(script, /ios\/App\/App\/AppDelegate.swift/);
  assert.doesNotMatch(script, /writeFileSync\([^)]*index\.html/);
  assert.doesNotMatch(script, /project\.pbxproj/);
});
