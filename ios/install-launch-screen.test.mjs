import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  installLaunchScreen, checkLaunchStoryboard, checkRedionStoryboard,
  imageAsset, colorAsset, COLORS, IMAGES, IOS_ROOT
} from './install-launch-screen.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const native = 'build/ios-capacitor/App/App';
const generatedStoryboard = native + '/Base.lproj/LaunchScreen.storyboard';
const generatedAssets = native + '/Assets.xcassets';
const template = '<?xml version="1.0"?><document launchScreen="YES">' +
  '<scenes><scene><objects><viewController id="native">' +
  '<view key="view"/></viewController></objects></scene></scenes></document>';

function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-ios-launch-'));
  const write = (relative, content) => {
    const dest = path.join(root, relative);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  };
  try {
    write('capacitor.config.json', fs.readFileSync(path.join(repo, 'capacitor.config.json')));
    write('ios/native-launch.storyboard',
      fs.readFileSync(path.join(repo, 'ios/native-launch.storyboard')));
    write(generatedStoryboard, template);
    fs.mkdirSync(path.join(root, generatedAssets), { recursive: true });
    for (const icon of IMAGES) {
      write(icon.source, fs.readFileSync(path.join(repo, icon.source)));
    }
    return run({ root, write });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('Redion-Launch-Screen verwendet ausschliesslich UIKit mit echten Autolayout-Constraints', () => {
  const xml = fs.readFileSync(path.join(repo, 'ios/native-launch.storyboard'), 'utf8');
  checkRedionStoryboard(xml);
  assert.match(xml, /initialViewController="01J-lp-oVM"/);
  assert.match(xml, /RedionLaunchIcon/);
  assert.match(xml, /firstAttribute="centerX"/);
  assert.match(xml, /firstAttribute="centerY"/);
  assert.match(xml, /<viewLayoutGuide key="safeArea"/);
  assert.doesNotMatch(xml, /(?:<script|<button|customClass=|<connections|<action )/);
  assert.equal((xml.match(/<viewController /g) || []).length, 1);
  assert.equal((xml.match(/<scene /g) || []).length, 1);
});

test('Farbsets verwenden native dynamische Hell-/Dunkelmodus-Farben', () => {
  assert.deepEqual(Object.keys(COLORS),
    ['RedionLaunchBackground', 'RedionLaunchText']);
  const bg = colorAsset(COLORS.RedionLaunchBackground);
  const fg = colorAsset(COLORS.RedionLaunchText);
  assert.equal(bg.colors.length, 2);
  assert.equal(bg.colors[1].appearances[0].value, 'dark');
  assert.equal(bg.colors[0].color.components.red, '0xF9');
  assert.equal(bg.colors[1].color.components.red, '0x19');
  assert.equal(fg.colors[0].color.components.red, '0x19');
  assert.equal(fg.colors[1].color.components.red, '0xF9');
  assert.deepEqual(imageAsset().images.map(x => x.scale), ['1x', '2x', '3x']);
});

test('Generated Xcode launch screen is replaced, versioned Redion scripts are not', () =>
  fixture(({ root }) => {
    const originalSource = fs.readFileSync(path.join(root, 'ios/native-launch.storyboard'));
    const result = installLaunchScreen(root);
    assert.equal(result.storyboard, path.join(root, generatedStoryboard));
    assert.equal(result.iconScales, 3);
    assert.equal(result.dynamicColors, 2);
    const nativeSource = fs.readFileSync(path.join(root, 'ios/native-launch.storyboard'));
    const generated = fs.readFileSync(result.storyboard);
    assert.deepEqual(nativeSource, originalSource, 'Versioned storyboard must not change.');
    assert.deepEqual(generated, originalSource, 'Generated storyboard must match versioned source.');
    for (const image of IMAGES) {
      assert.deepEqual(
        fs.readFileSync(path.join(root, generatedAssets,
          'RedionLaunchIcon.imageset', image.filename)),
        fs.readFileSync(path.join(root, image.source))
      );
    }
    const bg = JSON.parse(fs.readFileSync(path.join(root, generatedAssets,
      'RedionLaunchBackground.colorset/Contents.json'), 'utf8'));
    assert.equal(bg.colors[1].appearances[0].value, 'dark');
    const icon = JSON.parse(fs.readFileSync(path.join(root, generatedAssets,
      'RedionLaunchIcon.imageset/Contents.json'), 'utf8'));
    assert.equal(icon.images.length, 3);
    assert.throws(() => installLaunchScreen(root), /bereits eingebaut/,
      'Never overwrite an existing native Redion splash.');
  })
);

test('An unexpected Capacitor template aborts without overwriting anything', () =>
  fixture(({ root, write }) => {
    write(generatedStoryboard, '<document/>');
    const before = fs.readFileSync(path.join(root, generatedStoryboard));
    assert.throws(() => installLaunchScreen(root), /erwartete LaunchScreen/);
    assert.deepEqual(fs.readFileSync(path.join(root, generatedStoryboard)), before);
    assert.equal(fs.existsSync(path.join(root, generatedAssets,
      'RedionLaunchIcon.imageset')), false);
    assert.throws(() => checkLaunchStoryboard(''), /erwartete LaunchScreen/);
  })
);

test('Missing assets fail before modifying the generated Xcode storyboard', () =>
  fixture(({ root }) => {
    fs.rmSync(path.join(root, IMAGES[0].source));
    assert.throws(() => installLaunchScreen(root), /ENOENT/);
    assert.equal(fs.readFileSync(path.join(root, generatedStoryboard), 'utf8'), template);
  })
);

test('The app ID and generated folder are guarded; no deletion of personal data', () =>
  fixture(({ root, write }) => {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json')));
    config.ios.path = 'ios';
    write('capacitor.config.json', JSON.stringify(config));
    assert.throws(() => installLaunchScreen(root), /Abweichende Capacitor-App-ID oder iOS-Pfad/);
    assert.equal(fs.readFileSync(path.join(root, generatedStoryboard), 'utf8'), template);
  })
);

test('Codemagic runs native splash setup only after cap sync, never on the web', () => {
  const workflow = fs.readFileSync(path.join(repo, 'codemagic.yaml'), 'utf8');
  const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
  const config = JSON.parse(fs.readFileSync(path.join(repo, 'capacitor.config.json')));
  const source = fs.readFileSync(path.join(repo, 'ios/install-launch-screen.mjs'), 'utf8');
  assert.equal(config.ios.path, IOS_ROOT);
  const add = workflow.indexOf('npx cap add ios --packagemanager SPM');
  const sync = workflow.indexOf('npx cap sync ios');
  const splash = workflow.indexOf('node ios/install-launch-screen.mjs');
  const build = workflow.indexOf('xcodebuild');
  assert.ok(add < sync && sync < splash && splash < build);
  assert.match(workflow, /node --test ios\/install-launch-screen\.test\.mjs/);
  assert.match(workflow, /xcrun ibtool/);
  assert.doesNotMatch(html, /RedionLaunchIcon|native-launch\.storyboard/);
  assert.ok(!source.includes('removeSync(') && !source.includes('rmSync('));
});
