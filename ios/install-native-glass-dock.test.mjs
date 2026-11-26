import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { injectNativeGlassDock } from './install-native-glass-dock.mjs';

const swift = fs.readFileSync(new URL('./native-glass-dock.swift', import.meta.url), 'utf8');
const installer = fs.readFileSync(new URL('./install-native-glass-dock.mjs', import.meta.url), 'utf8');
const original = [
  'import UIKit',
  'func application(_ application: UIApplication) -> Bool {',
  '    RedionPrivacyShield.start()',
  '    return true',
  '}',
  'private final class RedionPrivacyShield: NSObject {}'
].join('\n');

test('nur die echte UITabBar in generierte Capacitor AppDelegate einbauen', () => {
  const result = injectNativeGlassDock(original, swift);
  assert.match(result, /RedionPrivacyShield\.start\(\)\n\s*\/\/ REDION_IOS_NATIVE_GLASS_DOCK\n\s*RedionNativeDock\.start\(\)/);
  assert.match(result, /UITabBar\(frame: \.zero\)/);
  assert.match(result, /WKScriptMessageHandler/);
  assert.throws(() => injectNativeGlassDock(result, swift), /bereits eingebaut/);
});

test('bei unpassender Vorlage fail-closed, keine zweite Installation', () => {
  assert.throws(() => injectNativeGlassDock('import UIKit', swift), /fehlt/);
  assert.throws(() => injectNativeGlassDock(original + '\nRedionPrivacyShield.start()', swift), /nicht eindeutig/);
  assert.throws(() => injectNativeGlassDock(original, 'import SwiftUI'), /fehlt/);
});

test('fuenf Apple Tab-Items leiten zur bestehenden Redion Navigation weiter', () => {
  for (const label of ['Dokumente','Heute','Lernen','Termine','Mehr']) {
    assert.ok(swift.includes('"' + label + '"'));
  }
  assert.match(swift, /UITabBarItem\(title:/);
  assert.match(swift, /UIImage\(systemName:/);
  assert.match(swift, /__redionNativeDockSelect/);
  assert.match(swift, /b\.click\(\)/);
  assert.match(swift, /__redionNativeDockTargets/);
  assert.match(swift, /UISelectionFeedbackGenerator/);
});

test('keine SwiftUI Seiten oder zweiter Editor ueber der WebView', () => {
  assert.doesNotMatch(swift, /RedionNativeMoreCoordinator|RedionNativeLibraryCoordinator|UIHostingController|RedionNativeEditorModel/);
  assert.doesNotMatch(installer, /native-more\.swift|native-library\.swift|native-editor\.swift|injectNativeIosShell/);
  assert.match(installer, /const modified = injectNativeGlassDock\(delegate, source\)/);
  assert.doesNotMatch(swift, /(?:localStorage|indexedDB|deleteDatabase|removeItem)/);
  assert.doesNotMatch(swift, /glassEffect\(/);
});

test('nur das alte Web Dock unsichtbar, keine doppelten Tab-Bars', () => {
  assert.match(swift, /redion-native-only-tabbar-style/);
  assert.match(swift, /html\.redion-ios-native-dock #handy-oben \*/);
  assert.match(swift, /visibility:hidden!important;opacity:0!important/);
  assert.match(swift, /pointer-events:none!important/);
  assert.match(swift, /legacyBar\?\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(swift, /document\.documentElement\.classList\.add\('redion-ios-native-dock'\)/);
  assert.doesNotMatch(swift, /legacyBar\?\.remove\(/);
  assert.doesNotMatch(swift, /display:none!important/);
});

test('Tab-Bar wird bei Tastatur, Modal oder Sperrschirm verborgen', () => {
  assert.match(swift, /const locked = !!document\.getElementById\('sperrschirm'\)/);
  assert.match(swift, /visible: dockShown && !modal && !locked && !editing && !keyboard/);
  assert.match(swift, /bar\.isHidden = !visible/);
});

test('UIKit entscheidet ueber originales Systemmaterial', () => {
  assert.match(swift, /let bar = UITabBar\(frame: \.zero\)/);
  assert.doesNotMatch(swift, /UITabBarAppearance\(/);
  assert.doesNotMatch(swift, /UIBlurEffect|UIVisualEffectView|glassEffect/);
  const app = fs.readFileSync(new URL('./native-sicherung.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /native-glass-dock\.swift/);
});

test('fuenf Ziele und eine separate Suchkapsel mit Apples Glas ab iOS 26', () => {
  assert.match(swift, /let search = UIButton\(type: \.system\)/);
  assert.match(swift, /if #available\(iOS 26\.0, \*\)[\s\S]*?configuration = \.glass\(\)/);
  assert.match(swift, /configuration = \.gray\(\)/);
  assert.match(swift, /bar\.trailingAnchor\.constraint\(equalTo: search\.leadingAnchor/);
  assert.match(swift, /search\.widthAnchor\.constraint\(equalToConstant: 52\)/);
  assert.match(swift, /search\.accessibilityLabel = "Suchen"/);
  assert.match(swift, /__redionNativeDockSearch/);
  assert.match(swift, /getElementById\('btn-suche-handy'\)/);
  assert.match(swift, /self\.searchButton\?\.isHidden = !visible/);
  assert.match(swift, /!keyboard && !drawing/);
  assert.match(swift, /\.document-studio, \.pg-flaeche, \.sp-voll/);
});


test('native Heute-first order routes and synchronizes by stable ID, not web order', () => {
  assert.match(swift, /private let labels = \["Heute", "Dokumente", "Lernen", "Termine", "Mehr"\]/);
  assert.match(swift, /private let symbols = \["house", "book.closed", "graduationcap", "calendar", "ellipsis"\]/);
  const bridge = swift.match(/private static let bridgeJavaScript = #"""([\s\S]*?)"""#/)[1];
  const domOrder = ['hl-dok', 'hl-start', 'hl-lernen', 'hl-bespr', 'hl-mehr'];
  const nativeOrder = ['hl-start', 'hl-dok', 'hl-lernen', 'hl-bespr', 'hl-mehr'];
  const actions = [], messages = [], frames = [];
  let selected = 'hl-start';
  const bar = { getClientRects: () => [1], setAttribute() {} };
  const buttons = new Map(domOrder.map(id => [id, {
    parentElement: bar,
    getAttribute: name => name === 'aria-selected' && id === selected ? 'true' : 'false',
    click() { selected = id; actions.push(['select', id]); },
    dispatchEvent(event) { actions.push([event.key, id]); }
  }]));
  const root = { dataset: { theme: 'dark' }, classList: { add() {} }, appendChild() {} };
  const document = {
    documentElement: root, head: root, body: {}, activeElement: null,
    createElement: () => ({}), addEventListener() {},
    getElementById: id => id === 'handy-oben' ? bar : null,
    querySelector: selector => buttons.get(selector.split('#').pop()) ?? null,
    querySelectorAll: selector => selector.includes('button[role="tab"]') ? [...buttons.values()] : []
  };
  const window = { innerHeight: 800, webkit: { messageHandlers: {
    redionDock: { postMessage: message => messages.push(message) }
  } } };
  vm.runInNewContext(bridge, {
    document, window, getComputedStyle: () => ({display: 'flex', visibility: 'visible'}),
    MutationObserver: class { observe() {} },
    KeyboardEvent: class { constructor(type, options) { this.key = options.key; } },
    requestAnimationFrame: cb => frames.push(cb)
  });
  const flush = () => { while (frames.length) frames.shift()(); };
  flush();
  assert.equal(messages.at(-1).selected, 0);
  nativeOrder.forEach((id, index) => {
    window.__redionNativeDockSelect(index); flush();
    assert.deepEqual(actions.at(-1), ['select', id]);
    assert.equal(messages.at(-1).selected, index);
    window.__redionNativeDockTargets(index);
    assert.deepEqual(actions.at(-1), ['ArrowUp', id]);
  });
  selected = 'hl-dok';
  window.__redionNativeDockSync(); flush();
  assert.equal(messages.at(-1).selected, 1);
});
