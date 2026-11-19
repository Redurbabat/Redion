import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { injectNativeGlassDock } from './install-native-glass-dock.mjs';

const swift = fs.readFileSync(new URL('./native-glass-dock.swift', import.meta.url), 'utf8');
const original = [
  'import UIKit',
  'func application(_ application: UIApplication) -> Bool {',
  '    RedionPrivacyShield.start()',
  '    return true',
  '}',
  'private final class RedionPrivacyShield: NSObject {}'
].join('\n');

test('injects native glass dock exactly once after privacy hook', () => {
  const result = injectNativeGlassDock(original, swift);
  assert.match(result, /RedionPrivacyShield\.start\(\)\n\s*\/\/ REDION_IOS_NATIVE_GLASS_DOCK\n\s*RedionNativeDock\.start\(\)/);
  assert.match(result, /import SwiftUI/);
  assert.match(result, /glassEffect\(\.regular, in: Capsule\(\)\)/);
  assert.throws(() => injectNativeGlassDock(result, swift), /bereits eingebaut/);
});

test('fails closed if the generated delegate does not match the expected Capacitor hook', () => {
  assert.throws(() => injectNativeGlassDock('import UIKit', swift), /fehlt/);
  assert.throws(() => injectNativeGlassDock(original + '\nRedionPrivacyShield.start()', swift), /nicht eindeutig/);
  assert.throws(() => injectNativeGlassDock(original, 'import SwiftUI'), /fehlt/);
});

test('five native tabs keep the existing web navigation as the only route', () => {
  for (const label of ['Dokumente', 'Heute', 'Lernen', 'Termine', 'Mehr']) {
    assert.ok(swift.includes('"' + label + '"'));
  }
  assert.match(swift, /__redionNativeDockSelect/);
  assert.match(swift, /b\.click\(\)/);
  assert.match(swift, /__redionNativeDockTargets/);
  assert.match(swift, /redion-ios-native-dock/);
  assert.match(swift, /#handy-oben/);
  assert.match(swift, /WKScriptMessageHandler/);
});

test('native dock remains isolated from PWA and saved data', () => {
  const app = fs.readFileSync(new URL('./native-sicherung.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /native-glass-dock\.swift/);
  assert.doesNotMatch(swift, /(?:localStorage|indexedDB|removeItem|deleteDatabase)/);
  assert.match(swift, /#available\(iOS 26\.0, \*\)/);
});
