/*
 * Native Apple UIKit system tab bar installer.
 * Only extends the GENERATED Capacitor AppDelegate after the privacy shield.
 * Does not touch PWA/index.html, the WKWebView store or Xcode project entries.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SIGNATURE = 'RedionPrivacyShield.start()';
const HOOK = 'RedionNativeDock.start()';
const MARKER = '// REDION_IOS_NATIVE_GLASS_DOCK';

export function injectNativeGlassDock(delegate, source) {
  if (typeof delegate !== 'string' || typeof source !== 'string' ||
      !delegate.includes('import UIKit') || !delegate.includes(SIGNATURE) ||
      !source.includes('private final class RedionNativeDock: NSObject, WKScriptMessageHandler') ||
      !source.includes('UITabBar(frame: .zero)')) {
    throw new Error('Native UITabBar-Quelle oder Capacitor-Datenschutz-Hook fehlt.');
  }
  if (delegate.includes(HOOK) || delegate.includes(MARKER) ||
      delegate.includes('class RedionNativeDock')) {
    throw new Error('Das native Dock wurde bereits eingebaut.');
  }
  if (delegate.split(SIGNATURE).length !== 2) {
    throw new Error('Capacitor-Hook nicht eindeutig; bestehende App nicht veraendern.');
  }
  const result = delegate.replace(SIGNATURE,
    SIGNATURE + '\n        ' + MARKER + '\n        ' + HOOK);
  return result.trimEnd() + '\n\n' + source.trim() + '\n';
}

export function installNativeGlassDock(root = process.cwd()) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  if (config.appId !== 'ch.redurbabat.redion' ||
      config.ios?.path !== 'build/ios-capacitor') {
    throw new Error('App-ID oder iOS-Zielpfad abweichend; native Installation gestoppt.');
  }
  const dest = path.join(root, config.ios.path, 'App', 'App', 'AppDelegate.swift');
  const sourcePath = path.join(root, 'ios', 'native-glass-dock.swift');
  const delegate = fs.readFileSync(dest, 'utf8');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const modified = injectNativeGlassDock(delegate, source);
  fs.writeFileSync(dest, modified);
  return dest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log('RED ION iOS: Native SwiftUI-Glasleiste installiert:',
      installNativeGlassDock());
  } catch (error) {
    console.error('RED ION iOS: Native Leiste NICHT installiert:', error.message);
    process.exitCode = 1;
  }
}
