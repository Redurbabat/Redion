import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectQuickActions } from './install-home-shortcuts.mjs';
import { injectIncomingShareWidget, GROUP } from './install-incoming-share-widget.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const originalScene = read('ios/fixtures/capacitor8-spm-scenedelegate.swift');

test('widget deeplinks reuse the existing secure three-destination router', () => {
  const patched = injectIncomingShareWidget(injectQuickActions(originalScene));
  assert.match(patched, /context\.url\.scheme == "redion"/);
  assert.match(patched, /context\.url\.host == "widget"/);
  assert.match(patched, /\["dokumente", "heute", "lernen"\]\.contains\(action\)/);
  assert.match(patched, /RedionHomeShortcuts\.shared\.open\(item, window: window\)/);
  assert.match(patched, /SceneDelegateProxy\.shared\.scene\(scene, openURLContexts: URLContexts\)/);
  assert.throws(() => injectIncomingShareWidget(patched), /bereits eingebaut/);
});

test('host receives App Group shares only after explicit durable JS acknowledgement', () => {
  const patched = injectIncomingShareWidget(injectQuickActions(originalScene));
  assert.equal(GROUP, 'group.ch.redurbabat.redion.share');
  assert.match(patched, /forSecurityApplicationGroupIdentifier: group/);
  assert.match(patched, /callAsyncJavaScript/);
  assert.match(patched, /window\.RedionNativeShare\?\.receive\(payload\)/);
  assert.match(patched, /case \.success\(let value\)/);
  assert.match(patched, /if case \.success\(let value\) = result, let accepted = value as\? Bool, accepted/);
  assert.match(patched, /FileManager\.default\.removeItem\(at: file\)/);
  assert.match(patched, /func sceneDidBecomeActive/);
  assert.match(patched, /\.pathExtension == "json"/);
  assert.match(patched, /\["text", "url"\]\.contains\(kind\)/);
});

test('unprepared or unexpected UIScene templates are not modified', () => {
  assert.throws(() => injectIncomingShareWidget(originalScene), /nicht.*vorbereitet/);
  assert.throws(() => injectIncomingShareWidget('import UIKit'), /nicht.*vorbereitet/);
});

test('Share Extension advertises only text and webpage URLs and uses App Group', () => {
  const info = read('ios/share-extension/Info.plist');
  const swift = read('ios/share-extension/RedionShareViewController.swift');
  const host = read('ios/share-extension/RedionApp.entitlements');
  const share = read('ios/share-extension/RedionShare.entitlements');
  assert.match(info, /com\.apple\.share-services/);
  assert.match(info, /NSExtensionActivationSupportsText/);
  assert.match(info, /NSExtensionActivationSupportsWebURLWithMaxCount/);
  assert.doesNotMatch(info, /NSExtensionActivationSupportsImageWithMaxCount|NSExtensionActivationSupportsFileWithMaxCount/);
  assert.match(swift, /NSItemProvider/);
  assert.match(swift, /write\(to: inbox\.appendingPathComponent\(id \+ "\.json"\), options: \.atomic\)/);
  assert.match(swift, /forSecurityApplicationGroupIdentifier:/);
  assert.equal((host.match(/group\.ch\.redurbabat\.redion\.share/g) || []).length, 1);
  assert.equal((share.match(/group\.ch\.redurbabat\.redion\.share/g) || []).length, 1);
  assert.doesNotMatch(swift, /URLSession|\.uploadTask|http\.request/);
});

test('WidgetKit has three destinations and never shows private local notes', () => {
  const widget = read('ios/widgets/RedionWidgets.swift');
  assert.match(widget, /import WidgetKit/);
  assert.match(widget, /redion:\/\/widget\//);
  for (const slug of ['dokumente', 'heute', 'lernen']) {
    assert.match(widget, new RegExp('id: "' + slug + '"'));
  }
  assert.doesNotMatch(widget, /UserDefaults|Store|IndexedDB|FileManager|AppGroup/);
});

test('generated target script only edits build/ios-capacitor, not tracked app', () => {
  const ruby = read('ios/install-share-widget-targets.rb');
  const yaml = read('codemagic.yaml');
  const native = read('ios/native-sicherung.ts');
  const web = read('index.html');
  assert.match(ruby, /project\.new_target\(:app_extension/);
  assert.match(ruby, /CodeSignOnCopy/);
  assert.match(ruby, /CODE_SIGN_ENTITLEMENTS/);
  assert.match(ruby, /project\.save/);
  assert.match(yaml, /REDION_IOS_EXTENSIONS:-0/);
  assert.match(yaml, /node ios\/install-incoming-share-widget\.mjs/);
  assert.match(yaml, /ruby ios\/install-share-widget-targets\.rb/);
  assert.match(yaml, /node --test ios\/incoming-share\.test\.mjs/);
  assert.match(native, /createIosShareInbox/);
  assert.doesNotMatch(web, /RedionNativeShare|RedionWidgets|incoming-share/);
  assert.equal(JSON.parse(read('capacitor.config.json')).appId, 'ch.redurbabat.redion');
});
