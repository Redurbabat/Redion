import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preflightNativeTemplates } from './preflight-native-templates.mjs';
import { injectQuickActions } from './install-home-shortcuts.mjs';
import { injectPrivacyShield } from './install-privacy-shield.mjs';
import { checkLaunchStoryboard } from './install-launch-screen.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const native = 'build/ios-capacitor/App/App';
const upstream = 'ios/fixtures/';

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-capacitor8-spm-'));
  const make = (name, content) => {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    return target;
  };
  try {
    make('capacitor.config.json', fs.readFileSync(path.join(repo, 'capacitor.config.json')));
    make('ios/privacy-shield.swift', fs.readFileSync(path.join(repo, 'ios/privacy-shield.swift')));
    make(native + '/AppDelegate.swift',
      fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-appdelegate.swift')));
    make(native + '/SceneDelegate.swift',
      fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-scenedelegate.swift')));
    make(native + '/Base.lproj/LaunchScreen.storyboard',
      fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-launch.storyboard')));
    make(native + '/Info.plist', '<plist version="1.0"><dict/></plist>');
    fs.mkdirSync(path.join(root, native, 'Assets.xcassets'));
    return run({ root, make });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('real Capacitor-8-SPM AppDelegate and SceneDelegate accept Redion native hooks', () => {
  const delegate = fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-appdelegate.swift'), 'utf8');
  const scene = fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-scenedelegate.swift'), 'utf8');
  const privacy = fs.readFileSync(path.join(repo, 'ios/privacy-shield.swift'), 'utf8');
  assert.match(delegate, /config\.delegateClass = SceneDelegate\.self/,
    'The captured UIScene AppDelegate must actually use the SceneDelegate fixture.');
  const storyboard = fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-launch.storyboard'), 'utf8');
  assert.doesNotThrow(() => checkLaunchStoryboard(storyboard));
  const guarded = injectPrivacyShield(delegate, privacy);
  const shortcuts = injectQuickActions(scene);
  assert.match(guarded, /RedionPrivacyShield\.start\(\)/);
  assert.match(shortcuts, /completionHandler\(handled\)/);
  assert.match(shortcuts, /SceneDelegateProxy\.shared\.scene\(scene, willConnectTo:/);
  assert.equal((shortcuts.match(/REDION_NATIVE_HOME_SHORTCUTS/g) || []).length, 1);
  assert.throws(() => injectQuickActions(shortcuts), /bereits eingebunden/);
  assert.throws(() => injectPrivacyShield(guarded, privacy), /bereits eingebunden/);
});

test('generated templates pass preflight WITHOUT being modified', () =>
  fixture(({ root }) => {
    const before = fs.readFileSync(path.join(root, native, 'SceneDelegate.swift'));
    const original = fs.readFileSync(path.join(root, native, 'AppDelegate.swift'));
    const result = preflightNativeTemplates(root);
    assert.equal(result.project, 'build/ios-capacitor');
    assert.equal(result.checked.length, 5);
    assert.deepEqual(fs.readFileSync(path.join(root, native, 'SceneDelegate.swift')), before);
    assert.deepEqual(fs.readFileSync(path.join(root, native, 'AppDelegate.swift')), original);
    assert.equal(fs.existsSync(path.join(root, native,
      'Assets.xcassets/RedionLaunchIcon.imageset')), false);
  })
);

test('missing UIScene file fails immediately, before branding or Swift mutation', () =>
  fixture(({ root }) => {
    const dest = path.join(root, native, 'SceneDelegate.swift');
    fs.rmSync(dest);
    assert.throws(() => preflightNativeTemplates(root), /SceneDelegate/);
    assert.equal(fs.existsSync(dest), false);
  })
);

test('Capacitor template drift in launch screen or Swift is a hard failure', () =>
  fixture(({ root, make }) => {
    const scene = path.join(root, native, 'SceneDelegate.swift');
    const original = fs.readFileSync(scene);
    make(native + '/Base.lproj/LaunchScreen.storyboard', '<document/>');
    assert.throws(() => preflightNativeTemplates(root), /erwartete LaunchScreen/);
    assert.deepEqual(fs.readFileSync(scene), original, 'No partial scene injection.');
    make(native + '/Base.lproj/LaunchScreen.storyboard',
      fs.readFileSync(path.join(repo, upstream + 'capacitor8-spm-launch.storyboard')));
    // Preserve the SceneDelegate wiring here. Otherwise preflight
    // correctly rejects that earlier, before the launch-method validator,
    // and this test cannot verify the distinct missing-signature failure.
    const delegate = fs.readFileSync(
      path.join(repo, upstream + 'capacitor8-spm-appdelegate.swift'), 'utf8');
    const signature = 'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {';
    assert.ok(delegate.includes(signature), 'Upstream fixture must contain the original launch signature.');
    assert.match(delegate, /config\.delegateClass = SceneDelegate\.self/);
    make(native + '/AppDelegate.swift', delegate.replace(
      signature, 'func unexpectedLaunch(_ application: UIApplication) -> Bool {'));
    assert.throws(() => preflightNativeTemplates(root), /Startfunktion/);
    assert.deepEqual(fs.readFileSync(scene), original, 'No partial Swift mutation.');
    assert.deepEqual(fs.readFileSync(path.join(root, native, 'AppDelegate.swift')),
      Buffer.from(delegate.replace(signature,
        'func unexpectedLaunch(_ application: UIApplication) -> Bool {')),
      'Preflight never edits the invalid input.');
  })
);

test('SceneDelegate must be connected by AppDelegate, not just present as an unused file', () =>
  fixture(({ root, make }) => {
    const original = fs.readFileSync(path.join(root, native, 'AppDelegate.swift'), 'utf8');
    make(native + '/AppDelegate.swift', original.replace(
      'config.delegateClass = SceneDelegate.self',
      'config.delegateClass = AppDelegate.self'));
    assert.throws(() => preflightNativeTemplates(root), /verbindet die UIScene nicht/);
    assert.equal(fs.existsSync(path.join(root, native,
      'Assets.xcassets/RedionLaunchIcon.imageset')), false);
  })
);

test('app ID/path mismatch is rejected before writing generated native files', () =>
  fixture(({ root, make }) => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json')));
    config.ios.path = 'ios';
    make('capacitor.config.json', JSON.stringify(config));
    assert.throws(() => preflightNativeTemplates(root), /App-ID oder generierter iOS-Projektpfad/);
  })
);

test('Codemagic validates templates before modifying AppDelegate, splash or SceneDelegate', () => {
  const yaml = fs.readFileSync(path.join(repo, 'codemagic.yaml'), 'utf8');
  const preflight = yaml.indexOf('node ios/preflight-native-templates.mjs');
  const privacy = yaml.indexOf('node ios/install-privacy-shield.mjs');
  const splash = yaml.indexOf('node ios/install-launch-screen.mjs');
  const shortcuts = yaml.indexOf('node ios/install-home-shortcuts.mjs');
  assert.ok(preflight > yaml.indexOf('npx cap sync ios'));
  assert.ok(preflight < privacy && privacy < splash && splash < shortcuts);
  assert.match(yaml, /node --test ios\/capacitor8-spm-native-integration\.test\.mjs/);
  assert.match(yaml, /ios-ibtool\.log/);
});
