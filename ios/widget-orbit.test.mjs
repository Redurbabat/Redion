/*
 * Redion Orbit: verifies user-visible widget design, motion constraints and
 * navigation without claiming WidgetKit, SwiftUI or Xcode have compiled.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const widget = fs.readFileSync(path.join(root, 'ios/widgets/RedionWidgets.swift'), 'utf8');
const shortcuts = fs.readFileSync(path.join(root, 'ios/home-shortcuts.mjs'), 'utf8');
const scene = fs.readFileSync(path.join(root, 'ios/install-incoming-share-widget.mjs'), 'utf8');
const codemagic = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');

test('Redion Orbit has real small, medium and large WidgetKit layouts', () => {
  assert.match(widget, /\.supportedFamilies\(\[\.systemSmall, \.systemMedium, \.systemLarge\]\)/);
  for (const expected of ['smallLayout', 'mediumLayout', 'largeLayout']) {
    assert.match(widget, new RegExp('private var ' + expected));
  }
  assert.match(widget, /\.contentMarginsDisabled\(\)/);
  assert.match(widget, /containerBackground\(/);
  assert.match(widget, /configurationDisplayName\("Redion Orbit"\)/);
});

test('small widget is a single tap; medium and large retain three real links', () => {
  assert.match(widget, /\.widgetURL\(URL\(string: "redion:\/\/widget\/heute"\)\)/);
  assert.match(widget, /Link\(destination: url\)/);
  assert.match(widget, /ForEach\(destinations\)/);
  const ids = [...widget.matchAll(/RedionDestination\(id: "(\w+)"/g)].map(x => x[1]);
  assert.deepEqual(ids, ['dokumente', 'heute', 'lernen']);
  assert.match(shortcuts, /dokumente: 'hl-dok'/);
  assert.match(shortcuts, /heute: 'hl-start'/);
  assert.match(shortcuts, /lernen: 'hl-lernen'/);
  assert.match(scene, /\["dokumente", "heute", "lernen"\]/);
});

test('depth is drawn from native gradients/orbits, with no downloaded graphics', () => {
  assert.match(widget, /struct RedionOrbitBackdrop/);
  assert.match(widget, /RadialGradient/);
  assert.match(widget, /AngularGradient/);
  assert.match(widget, /rotationEffect\(/);
  assert.match(widget, /LinearGradient/);
  assert.match(widget, /\.allowsHitTesting\(false\)/);
  assert.match(widget, /accessibilityLabel\("Redion – Heute öffnen"\)/);
  assert.doesNotMatch(widget, /AsyncImage|URLSession|URLRequest|FileManager|UserDefaults|AppGroup|IndexedDB/);
});

test('Orbit planets are rendered by SwiftUI with rim light, crescent and real starfield', () => {
  assert.match(widget, /private struct RedionPlanet: View/);
  assert.match(widget, /RedionPlanet\(diameter: size \* 0\.66/);
  assert.match(widget, /RedionPlanet\(diameter: size \* 0\.31/);
  assert.match(widget, /RadialGradient\(stops: \[/);
  assert.match(widget, /\.trim\(from: 0\.03, to: 0\.29\)/);
  assert.match(widget, /ForEach\(0\.\.<19, id: \\.self\)/);
  assert.match(widget, /\.shadow\(color: accent\.opacity\(0\.34\), radius: 13\)/);
  assert.doesNotMatch(widget, /Double\.random|Int\.random|arc4random|URLSession|AsyncImage/);
});

test('reference-inspired cyan, apricot and violet glass cards remain real links', () => {
  assert.match(widget, /id: "dokumente"[^]*?tint: RedionPalette\.teal\)/);
  assert.match(widget, /id: "heute"[^]*?tint: RedionPalette\.peach\)/);
  assert.match(widget, /id: "lernen"[^]*?tint: RedionPalette\.violet\)/);
  assert.match(widget, /RoundedRectangle\(cornerRadius: 16/);
  assert.match(widget, /\.stroke\(LinearGradient\(colors:/);
  assert.match(widget, /\.shadow\(color: destination\.tint\.opacity\(0\.28\), radius: 9/);
  assert.match(widget, /\.frame\(maxWidth: \.infinity, minHeight: vertical \? 55 : 56/);
  assert.match(widget, /Link\(destination: url\)/);
});

test('small and medium layouts fit legacy iOS widget margins', () => {
  assert.match(widget, /\.padding\(8\)/);
  assert.match(widget, /private var mediumLayout: some View \{[^]*?RedionSignature\(compact: true\)/);
  assert.match(widget, /\.frame\(maxWidth: \.infinity, minHeight: vertical \? 55 : 56/);
  assert.match(widget, /extra 30pt icon that clips small widgets on iOS 15\/16/);
  assert.doesNotMatch(widget, /Image\(systemName: "sparkles\.rectangle\.stack"\)/);
});

test('the three layouts reflect the photographed headline and small widget action', () => {
  assert.match(widget, /Text\("Ein "\)/);
  assert.match(widget, /Text\("Gedanke\."\)/);
  assert.match(widget, /Text\("Heute öffnen"\)/);
  assert.match(widget, /Text\("Drei Wege\. "\)/);
  assert.match(widget, /Text\("Alles deins\."\)/);
  assert.match(widget, /Text\("Ideen finden\."\)/);
  assert.match(widget, /Text\("Wissen bewegen\."\)/);
  assert.match(widget, /Text\("Dein Raum für das, was zählt\."\)/);
  assert.match(widget, /Capsule\(\)/);
});

test('native illustration stays static in reduced motion and old iOS retains margins', () => {
  assert.match(widget, /private var position: Int \{ reducedMotion \? 0 : phase % 8 \}/);
  assert.match(widget, /RedionPlanet\(diameter: size \* 0\.66,[^]*?phase: position/);
  assert.match(widget, /@Environment\(\\\.accessibilityReduceMotion\)/);
  assert.match(widget, /if #available\(iOSApplicationExtension 17\.0, \*\)/);
  assert.match(widget, /configuration\.contentMarginsDisabled\(\)/);
  assert.match(widget, /configuration\n        \}/);
  assert.doesNotMatch(widget, /\.repeatForever\(|TimelineView\s*\{|Timer\.scheduledTimer/);
});

test('the orbit updates on a 3-hour timeline, not continuous battery-draining timers', () => {
  assert.match(widget, /component\(\.hour, from: date\) \/ 3/);
  assert.match(widget, /index \* 3/);
  assert.match(widget, /0\.\.<9/);
  assert.match(widget, /policy: \.atEnd/);
  assert.doesNotMatch(widget, /TimelineView\s*\{|Timer\.scheduledTimer|CADisplayLink\s*\(|\.repeatForever\s*\(|animation\(\.linear\(duration:|\.task\s*\{|onAppear\s*\{/);
});

test('WidgetKit motion is under two seconds and is disabled for Reduce Motion', () => {
  assert.match(widget, /@Environment\(\\\.accessibilityReduceMotion\)/);
  assert.match(widget, /reducedMotion \? 0 : phase % 8/);
  const durations = [...widget.matchAll(/easeInOut\(duration: ([\d.]+)\)/g)].map(x => Number(x[1]));
  assert.ok(durations.length >= 2);
  assert.ok(durations.every(x => x > 0 && x <= 2), 'Apple WidgetKit max transition duration is 2s.');
  assert.match(widget, /\.animation\(reducedMotion \? nil/);
  assert.match(widget, /\.animation\(reduceMotion \? nil/);
});

test('motion redesign does not activate unsigned preview extensions by default', () => {
  assert.match(codemagic, /REDION_IOS_EXTENSIONS:-0/);
  assert.match(codemagic, /node --test ios\/widget-orbit\.test\.mjs/);
  assert.match(codemagic, /xcrun swiftc -frontend -parse ios\/widgets\/RedionWidgets\.swift/);
  assert.match(codemagic, /xcrun swiftc -frontend -parse ios\/share-extension\/RedionShareViewController\.swift/);
  assert.doesNotMatch(widget, /\bStore\b|\bIndexedDB\b|\bFileManager\b|\bUserDefaults\b/);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  assert.equal(config.appId, 'ch.redurbabat.redion');
  assert.equal(config.ios.path, 'build/ios-capacitor');
});
