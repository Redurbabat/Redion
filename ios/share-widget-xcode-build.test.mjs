/*
 * Regression gate for generated Xcode extension targets.
 * No attempt to emulate xcodebuild: this enforces prerequisites and makes
 * Codemagic verify both real .appex bundles on the macOS/Xcode runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const ruby = source('ios/install-share-widget-targets.rb');
const yaml = source('codemagic.yaml');
const share = source('ios/share-extension/Info.plist');
const widget = source('ios/widgets/Info.plist');
const groupHost = source('ios/share-extension/RedionApp.entitlements');
const groupExtension = source('ios/share-extension/RedionShare.entitlements');

test('WidgetKit and Share Extension use valid matching Apple plist DTDs', () => {
  const dtd = /<!DOCTYPE plist PUBLIC "-\/\/Apple\/\/DTD PLIST 1\.0\/\/EN" "http:\/\/www\.apple\.com\/DTDs\/PropertyList-1\.0\.dtd">/;
  assert.match(widget, dtd);
  assert.match(share, dtd);
  assert.doesNotMatch(widget, /PropertyList-1\.0\/\/EN/);
  assert.match(widget, /com\.apple\.widgetkit-extension/);
  assert.match(share, /com\.apple\.share-services/);
});

test('App Group is shared by host and incoming Share Extension only', () => {
  const group = 'group.ch.redurbabat.redion.share';
  assert.ok(groupHost.includes(group));
  assert.ok(groupExtension.includes(group));
  assert.equal((groupHost.match(/group\.ch\.redurbabat\.redion\.share/g) || []).length, 1);
  assert.equal((groupExtension.match(/group\.ch\.redurbabat\.redion\.share/g) || []).length, 1);
  assert.match(ruby, /entitlements\['com\.apple\.security\.application-groups'\] == \[group_id\]/);
  assert.match(ruby, /host_entitlements\['com\.apple\.security\.application-groups'\] == \[group_id\]/);
});

test('extension installer preserves Capacitor/plugin URL schemes', () => {
  assert.match(ruby, /Xcodeproj::Plist\.read_from_path\(plist\)/);
  assert.match(ruby, /host_info\.fetch\('CFBundleURLTypes', \[\]\)/);
  assert.match(ruby, /url_types\.any\?/);
  assert.match(ruby, /host_info\['CFBundleURLTypes'\] = url_types \+ \[\{/);
  assert.match(ruby, /Xcodeproj::Plist\.write_to_path\(host_info, plist\)/);
  assert.doesNotMatch(ruby, /PlistBuddy/);
  assert.doesNotMatch(ruby, /CFBundleURLTypes:0/);
});

test('generated Xcode project embeds both extension target products and uses app ID', () => {
  assert.match(ruby, /project\.new_target\(:app_extension, name, :ios, '15\.0'\)/);
  assert.match(ruby, /app\.add_dependency\(target\)/);
  assert.match(ruby, /embed\.add_file_reference\(target\.product_reference, true\)/);
  assert.match(ruby, /CodeSignOnCopy/);
  assert.match(ruby, /%w\[RedionShare\.appex RedionWidgets\.appex\]/);
  assert.match(ruby, /Xcodeproj::Project\.open\(project_path\)/);
  assert.match(ruby, /project\.save/);
  assert.match(ruby, /PRODUCT_BUNDLE_IDENTIFIER/);
  assert.match(ruby, /ch\.redurbabat\.redion\.share/);
  assert.match(ruby, /ch\.redurbabat\.redion\.widgets/);
});

test('Codemagic validates generated UIScene Swift before Xcode build', () => {
  const scene = 'xcrun swiftc -frontend -parse build/ios-capacitor/App/App/SceneDelegate.swift';
  assert.ok(yaml.includes(scene));
  assert.ok(yaml.indexOf('node ios/install-incoming-share-widget.mjs') < yaml.indexOf(scene));
  assert.ok(yaml.indexOf(scene) < yaml.indexOf('ruby ios/install-share-widget-targets.rb'));
  assert.match(yaml, /ruby -c ios\/install-share-widget-targets\.rb/);
});

test('Codemagic explicitly verifies BOTH compiled .appex bundles before IPA packaging', () => {
  assert.match(yaml, /REDION_IOS_EXTENSIONS:-0/);
  assert.match(yaml, /APP\/PlugIns\/\$extension\.appex/);
  assert.match(yaml, /test -d "\$EXT"/);
  assert.match(yaml, /Print :NSExtension:NSExtensionPointIdentifier/);
  assert.match(yaml, /com\.apple\.widgetkit-extension/);
  assert.match(yaml, /com\.apple\.share-services/);
  assert.match(yaml, /Print :CFBundleIdentifier/);
  assert.match(yaml, /test "\$\(\/usr\/libexec\/PlistBuddy/);
  assert.ok(yaml.indexOf('test -d "$EXT"') < yaml.indexOf('mkdir -p "$CM_BUILD_DIR/build/ipa/Payload"'));
});

test('Web, PWA, local Redion database and install identity remain unchanged', () => {
  const html = source('index.html');
  assert.doesNotMatch(html, /incoming-share|RedionWidgets|RedionNativeShare/);
  const config = JSON.parse(source('capacitor.config.json'));
  assert.equal(config.appId, 'ch.redurbabat.redion');
  assert.equal(config.ios.path, 'build/ios-capacitor');
  const state = source('ios/native-sicherung.ts');
  assert.match(state, /createIosShareInbox/);
});
