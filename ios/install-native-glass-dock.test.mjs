import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { injectNativeGlassDock, injectNativeIosShell } from './install-native-glass-dock.mjs';

const swift = fs.readFileSync(new URL('./native-glass-dock.swift', import.meta.url), 'utf8');
const more = fs.readFileSync(new URL('./native-more.swift', import.meta.url), 'utf8');
const library = fs.readFileSync(new URL('./native-library.swift', import.meta.url), 'utf8');
const editor = fs.readFileSync(new URL('./native-editor.swift', import.meta.url), 'utf8');
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
  const generated = injectNativeIosShell(original, swift, more, library, editor);
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
  assert.throws(() => injectNativeIosShell(original, swift, 'bad file', library, editor), /fehlen/);
  assert.throws(() => injectNativeIosShell(generated, swift, more, library, editor), /bereits eingebaut/);
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

test('native Documents screen reads existing pages only and checks permissions', () => {
  const generated = injectNativeIosShell(original, swift, more, library, editor);
  assert.match(generated, /RedionNativeLibraryCoordinator/);
  assert.match(generated, /RedionNativeLibraryView/);
  assert.match(swift, /nativeLibrary\.sync\(selected: selected, dockVisible: visible, locked: locked\)/);
  assert.match(swift, /const locked = !!document\.getElementById\('sperrschirm'\)/);
  assert.match(swift, /visible: dockShown && !modal && !locked && !editing && !keyboard/);
  assert.match(swift, /nativeLibrary\.restoreForDocumentsTab\(\)/);
  assert.match(library, /Store\.cache\.blocks/);
  assert.match(library, /ablage\.geladen/);
  assert.match(library, /nachreichen:true/);
  assert.match(library, /__redionNativeLibraryLoaded/);
  assert.match(library, /getElementById\('sperrschirm'\)/);
  assert.match(library, /Konten\.darf\('lesen', p\.id\)/);
  assert.match(library, /typeof App\.oeffne/);
  assert.match(library, /callAsyncJavaScript\(Self\.openJavaScript/);
  assert.match(library, /arguments: \["pageId": id\]/);
  assert.match(library, /Store\.getBlock\(pageId\)/);
  assert.doesNotMatch(library, /(?:indexedDB\.open|Store\.addPage|Store\.updateBlock|Store\.wipe|deleteDatabase)/);
  assert.throws(() => injectNativeIosShell(original, swift, more, '', editor), /fehlen/);
});

test('native text editor reads direct blocks and saves only versioned, authorized changes', () => {
  const generated = injectNativeIosShell(original, swift, more, library, editor);
  for (const name of ['RedionNativeEditorModel','RedionNativeEditorView']) {
    assert.match(generated, new RegExp(name));
  }
  assert.match(library, /RedionNativeEditorModel\(web: web\)/);
  assert.match(library, /openNativePage\(id\)/);
  assert.match(library, /RedionNativeEditorView\(model: editor, openClassic: openClassic\)/);
  assert.match(editor, /TextEditor\(text: \$model\.proposedText\)/);
  assert.match(editor, /arguments: \[/);
  assert.match(editor, /Store\.versionSpeichern\(/);
  assert.match(editor, /Store\.updateBlock\(block\.id,\{text:replacement\}\)/);
  assert.match(editor, /await Store\.flush\(\)/);
  assert.match(editor, /await Store\.settled\(\)/);
  assert.match(editor, /String\(block\.edited \|\| ''\) !== expectedEdited/);
  assert.match(editor, /Konten\.darf\('bearbeiten',block\.id\)/);
  assert.match(editor, /document\.getElementById\('sperrschirm'\)/);
  assert.match(editor, /Store\.speichertNicht\(\)/);
  assert.match(editor, /typeof replacement !== 'string'/);
  assert.match(editor, /const isChild = Store\.childrenOf\(page\.id\)\.some/);
  assert.match(editor, /return \{ok:false,reason:'unsupported'\}/);
  assert.doesNotMatch(editor, /(?:indexedDB\.open|deleteDatabase|Store\.wipe|Store\.importAll|Store\.addBlock)/);
  assert.throws(() => injectNativeIosShell(original, swift, more, library, ''), /fehlen/);
});

test('native text editor privacy and keyboard contracts', () => {
  assert.match(library, /func sync\(selected: Int, dockVisible: Bool, locked: Bool\)/);
  assert.match(library, /let hasNativeSheet = editor\?\.presented == true/);
  assert.match(library, /editor\?\.hideForPrivacy\(\)/);
  assert.match(swift, /locked,\s*\n\s*theme:/);
  assert.match(swift, /let locked = \(data\["locked"\] as\? Bool\) \?\? false/);
  assert.match(editor, /interactiveDismissDisabled\(model\.saving \|\| model\.editingId != nil\)/);
  assert.match(editor, /func hideForPrivacy\(\)/);
});
