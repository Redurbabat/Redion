import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { injectNativeGlassDock, injectNativeIosShell } from './install-native-glass-dock.mjs';

const swift = fs.readFileSync(new URL('./native-glass-dock.swift', import.meta.url), 'utf8');
const more = fs.readFileSync(new URL('./native-more.swift', import.meta.url), 'utf8');
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
  assert.match(result, /import UIKit/);
  assert.match(result, /UITabBar\(frame: \.zero\)/);
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
  assert.match(swift, /UITabBarDelegate/);
  assert.match(swift, /UITabBarItem/);
  assert.doesNotMatch(swift, /glassEffect\(/);
});

test('native More, Settings, Files and About screens compile as part of the iOS shell', () => {
  const generated = injectNativeIosShell(original, swift, more);
  for (const name of [
    'RedionNativeMoreView', 'RedionNativeSettingsView',
    'RedionNativeFilesView', 'RedionNativeAboutView',
    'RedionNativeMoreCoordinator'
  ]) {
    assert.ok(generated.includes(name), 'Missing native SwiftUI screen: ' + name);
  }
  assert.match(generated, /UIHostingController/);
  assert.match(generated, /ShareLink\(item: file\.url\)/);
  assert.match(generated, /quickLookPreview/);
  assert.match(generated, /\.isRegularFileKey/);
  assert.match(generated, /\.isSymbolicLinkKey/);
  assert.match(generated, /nativeMore\.sync\(selected: selected, dockVisible: visible\)/);
  assert.throws(() => injectNativeIosShell(original, swift, 'bad file'), /fehlen/);
  assert.throws(() => injectNativeIosShell(generated, swift, more), /bereits eingebaut/);
});

test('native screens never access RED ION stored notes or MCP', () => {
  assert.doesNotMatch(more, /(?:indexedDB|localStorage|deleteDatabase|removeItem|\.deleteItem\()/);
  assert.doesNotMatch(more, /(?:MCP\.connect|store\.clear|Store\.cache)/);
  assert.match(more, /file\.url/);
  for (const action of ['workspace', 'schublade', 'sichern', 'import', 'wolke', 'einstellungen']) {
    assert.ok(more.includes('"' + action + '"'), 'Missing existing RED ION action: ' + action);
  }
});

test('native iPhone uses exactly one painted and accessible dock', () => {
  assert.match(swift, /redion-native-only-tabbar-style/);
  assert.match(swift, /html\.redion-ios-native-dock #handy-oben \*/);
  assert.match(swift, /visibility:hidden!important;opacity:0!important/);
  assert.match(swift, /pointer-events:none!important/);
  assert.match(swift, /legacyBar\?\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(swift, /document\.documentElement\.classList\.add\('redion-ios-native-dock'\)/);
  assert.match(swift, /UITabBar\(frame: \.zero\)/);
  // Only presentation is hidden. The original route/gesture DOM is retained
  // until the corresponding feature is fully migrated to native Swift.
  assert.doesNotMatch(swift, /legacyBar\?\.remove\(/);
  assert.doesNotMatch(swift, /display:none!important/);
});
