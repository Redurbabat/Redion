/*
 * iOS-only Redion cold-launch experience.
 *
 * Run only after `npx cap add ios` and `npx cap sync ios` in Codemagic.
 * We replace only the GENERATED Capacitor LaunchScreen.storyboard and
 * add asset catalog entries under build/ios-capacitor/. Nothing under the
 * version-controlled ios/ source tree or website/PWA is changed.
 *
 * This is a static UIKit launch screen, not a fullscreen HTML splash.
 * Apple launch screens may not run arbitrary code, ask permissions or
 * retrieve private documents.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const IOS_ROOT = 'build/ios-capacitor';
export const BRAND = 'Redion';
export const IMAGES = Object.freeze([
  { source: 'oeffentlich/icons/icon-96.png', filename: 'RedionLaunch-1x.png', scale: '1x' },
  { source: 'oeffentlich/icons/icon-192.png', filename: 'RedionLaunch-2x.png', scale: '2x' },
  { source: 'oeffentlich/icons/icon-384.png', filename: 'RedionLaunch-3x.png', scale: '3x' }
]);

// Color assets resolve immediately in UIKit, before Redion's IndexedDB
// settings can be read. Light and dark correspond to the DEVICE setting.
export const COLORS = Object.freeze({
  RedionLaunchBackground: { light: '#F9FAFC', dark: '#191A1E' },
  RedionLaunchText: { light: '#191A1E', dark: '#F9FAFC' }
});

function rgbHexColor(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error('Unerwartete Launch-Farbe.');
  return {
    'color-space': 'srgb',
    components: {
      red: '0x' + hex.slice(1, 3),
      green: '0x' + hex.slice(3, 5),
      blue: '0x' + hex.slice(5, 7),
      alpha: '1.000'
    }
  };
}

export function colorAsset({ light, dark }) {
  return {
    colors: [
      { color: rgbHexColor(light), idiom: 'universal' },
      {
        appearances: [{ appearance: 'luminosity', value: 'dark' }],
        color: rgbHexColor(dark),
        idiom: 'universal'
      }
    ],
    info: { author: 'xcode', version: 1 }
  };
}

export function imageAsset() {
  return {
    images: IMAGES.map(image => ({ idiom: 'universal', filename: image.filename, scale: image.scale })),
    info: { author: 'xcode', version: 1 }
  };
}

export function checkLaunchStoryboard(xml) {
  if (typeof xml !== 'string' ||
      !xml.includes('<document ') ||
      !xml.includes('launchScreen="YES"') ||
      !xml.includes('<viewController ') ||
      !xml.includes('<view key="view"')) {
    throw new Error('Capacitor hat keine erwartete LaunchScreen.storyboard erzeugt.');
  }
  if (xml.includes('RD1-IM-AGE') || xml.includes('RedionLaunchIcon')) {
    throw new Error('Der native Redion-Startbildschirm ist bereits eingebaut.');
  }
}

export function checkRedionStoryboard(xml) {
  if (typeof xml !== 'string' || !xml.includes('launchScreen="YES"') ||
      !xml.includes('image="RedionLaunchIcon"') ||
      !xml.includes('name="RedionLaunchBackground"') ||
      !xml.includes('name="RedionLaunchText"') ||
      !xml.includes('text="Redion"') ||
      /(?:<script|<button|customClass=|<connections|<action )/.test(xml)) {
    throw new Error('Redion-Storyboard ist unvollständig oder nicht statisch.');
  }
}

const pngValid = bytes => bytes.length > 24 &&
  bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));

export function installLaunchScreen(root = process.cwd()) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  if (config.appId !== 'ch.redurbabat.redion' || config.webDir !== 'www' ||
      config.ios?.path !== IOS_ROOT) {
    throw new Error('Abweichende Capacitor-App-ID oder iOS-Pfad: Installation angehalten.');
  }
  const native = path.join(root, IOS_ROOT, 'App', 'App');
  const storyboard = path.join(native, 'Base.lproj', 'LaunchScreen.storyboard');
  const source = path.join(root, 'ios', 'native-launch.storyboard');
  const catalogue = path.join(native, 'Assets.xcassets');

  // All inputs validated BEFORE anything is overwritten.
  const original = fs.readFileSync(storyboard, 'utf8');
  const branded = fs.readFileSync(source, 'utf8');
  checkLaunchStoryboard(original);
  checkRedionStoryboard(branded);
  if (!fs.statSync(catalogue).isDirectory()) throw new Error('Xcode-Assetkatalog fehlt.');

  const imageBytes = IMAGES.map(image => {
    const bytes = fs.readFileSync(path.join(root, image.source));
    if (!pngValid(bytes)) throw new Error('Redion-Icon ist kein gültiges PNG: ' + image.source);
    const expectedSize = Number(image.scale[0]) * 96;
    if (bytes.readUInt32BE(16) !== expectedSize || bytes.readUInt32BE(20) !== expectedSize) {
      throw new Error('Unpassende Auflösung für native iOS-Icon-Skala: ' + image.source);
    }
    return bytes;
  });

  // These names are unique to Redion. Refuse to replace any existing asset
  // instead of silently overwriting assets installed by another plugin.
  const imageDirectory = path.join(catalogue, 'RedionLaunchIcon.imageset');
  if (fs.existsSync(imageDirectory)) throw new Error('Redion-Starticon ist bereits vorhanden.');
  for (const name of Object.keys(COLORS)) {
    if (fs.existsSync(path.join(catalogue, name + '.colorset'))) {
      throw new Error('Native Startfarbe ist bereits vorhanden: ' + name);
    }
  }

  const writeJson = (filename, data) => fs.writeFileSync(filename, JSON.stringify(data, null, 2) + '\n');
  fs.mkdirSync(imageDirectory);
  writeJson(path.join(imageDirectory, 'Contents.json'), imageAsset());
  for (let i = 0; i < IMAGES.length; i++) {
    fs.writeFileSync(path.join(imageDirectory, IMAGES[i].filename), imageBytes[i]);
  }
  for (const [name, colors] of Object.entries(COLORS)) {
    const directory = path.join(catalogue, name + '.colorset');
    fs.mkdirSync(directory);
    writeJson(path.join(directory, 'Contents.json'), colorAsset(colors));
  }
  fs.writeFileSync(storyboard, branded);
  return { storyboard, catalogue, iconScales: IMAGES.length, dynamicColors: Object.keys(COLORS).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = installLaunchScreen();
    console.log('Redion iOS: Nativen Hell/Dunkel-Startschirm installiert:',
      result.storyboard, '- Icons:', result.iconScales, '- Farben:', result.dynamicColors);
  } catch (error) {
    console.error('Redion iOS: Nativer Startschirm nicht eingebaut:', error.message);
    process.exitCode = 1;
  }
}
