/*
 * Read-only check of Capacitor's GENERATED Swift/Storyboard files.
 * Run immediately after cap add/sync, before Redion's native installers.
 * No Web/PWA assets, app data, native sources or Xcode files are modified.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkLaunchStoryboard } from './install-launch-screen.mjs';
import { injectPrivacyShield } from './install-privacy-shield.mjs';
import { injectQuickActions } from './install-home-shortcuts.mjs';

export function preflightNativeTemplates(root = process.cwd()) {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  if (cfg.appId !== 'ch.redurbabat.redion' ||
      cfg.ios?.path !== 'build/ios-capacitor') {
    throw new Error('Redion-App-ID oder generierter iOS-Projektpfad abweichend.');
  }
  const native = path.join(root, cfg.ios.path, 'App', 'App');
  const paths = {
    storyboard: path.join(native, 'Base.lproj', 'LaunchScreen.storyboard'),
    appDelegate: path.join(native, 'AppDelegate.swift'),
    sceneDelegate: path.join(native, 'SceneDelegate.swift'),
    info: path.join(native, 'Info.plist'),
    assets: path.join(native, 'Assets.xcassets')
  };
  for (const [name, filename] of Object.entries(paths)) {
    if (!fs.existsSync(filename)) {
      throw new Error('Capacitor-8-SPM-Vorlage fehlt: ' + name + ' (' + filename + ').');
    }
  }
  if (!fs.statSync(paths.assets).isDirectory()) {
    throw new Error('Capacitor-8-SPM-Assetkatalog ist kein Verzeichnis.');
  }
  const storyboard = fs.readFileSync(paths.storyboard, 'utf8');
  checkLaunchStoryboard(storyboard);
  const privacy = fs.readFileSync(path.join(root, 'ios/privacy-shield.swift'), 'utf8');
  const appDelegate = fs.readFileSync(paths.appDelegate, 'utf8');
  const sceneDelegate = fs.readFileSync(paths.sceneDelegate, 'utf8');
  // Redion installs home-screen shortcuts into SceneDelegate. It must
  // actually be wired up by UIApplicationDelegate in the current SPM app;
  // a present but unused Swift file would otherwise silently pass.
  if (!appDelegate.includes('SceneDelegate.self')) {
    throw new Error('Capacitor-AppDelegate verbindet die UIScene nicht mit SceneDelegate.');
  }
  // Prove that our current injectors would accept the upstream source,
  // but do NOT write their results until the individual Codemagic stages.
  const delegate = injectPrivacyShield(appDelegate, privacy);
  const scene = injectQuickActions(sceneDelegate);
  if (!delegate.includes('RedionPrivacyShield.start()') ||
      !scene.includes('REDION_NATIVE_HOME_SHORTCUTS')) {
    throw new Error('Native Redion-Hooks fehlen nach Probeinbindung.');
  }
  if (!fs.readFileSync(paths.info, 'utf8').includes('<plist')) {
    throw new Error('Capacitor-Info.plist ist keine erwartete Property List.');
  }
  return { checked: Object.keys(paths), project: cfg.ios.path };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = preflightNativeTemplates();
    console.log('Redion iOS: Capacitor-8-SPM-Vorlagen geprüft (unverändert):',
      result.checked.join(', '));
  } catch (error) {
    console.error('Redion iOS: Native Vorlagen-Prüfung fehlgeschlagen:', error.message);
    process.exitCode = 1;
  }
}
