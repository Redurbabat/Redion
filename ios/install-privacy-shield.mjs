/*
 * Hängt den Datenschutzschirm in die bereits kompilierte AppDelegate.swift
 * ein. Kein pbxproj-Patch, kein neues Plugin, keine Web-Datei ändert sich.
 * Bei abweichender Capacitor-Template-Struktur fehlschlagen statt blind
 * Code in das iOS-Projekt einzufügen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SIGNATURE = 'func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {';
const HOOK = 'RedionPrivacyShield.start()';
const MARKER = '// REDION_IOS_PRIVACY_SHIELD – NUR NATIVE APP';

export function injectPrivacyShield(appDelegate, shieldSource) {
  if (typeof appDelegate !== 'string' || typeof shieldSource !== 'string') {
    throw new TypeError('Swift-Quelldateien fehlen.');
  }
  if (!shieldSource.includes('private final class RedionPrivacyShield: NSObject')) {
    throw new Error('Datenschutzschirm hat keine gültige Swift-Klasse.');
  }
  if (appDelegate.includes(MARKER) || appDelegate.includes(HOOK)) {
    throw new Error('Der iOS-Datenschutzschirm wurde bereits eingebunden.');
  }
  if (appDelegate.split(SIGNATURE).length !== 2) {
    throw new Error('Capacitor-AppDelegate-Startfunktion wurde nicht eindeutig gefunden.');
  }
  if (!appDelegate.includes('import UIKit')) {
    throw new Error('Die erwartete UIKit-AppDelegate fehlt.');
  }

  const hook = '\n        ' + MARKER + '\n        ' + HOOK + '\n';
  const updated = appDelegate.replace(SIGNATURE, SIGNATURE + hook);
  // Source is compiled as part of the AppDelegate target, avoiding any
  // dependency on Xcode project.pbxproj edits (also for SPM).
  return updated.trimEnd() + '\n\n' + shieldSource.trim() + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const dest = path.join(root, 'ios/App/App/AppDelegate.swift');
  const source = path.join(root, 'ios/privacy-shield.swift');
  if (!fs.existsSync(dest) || !fs.existsSync(source)) {
    console.error('Capacitor iOS-AppDelegate oder Datenschutzschirm fehlt.');
    process.exitCode = 1;
  } else {
    try {
      const original = fs.readFileSync(dest, 'utf8');
      const shield = fs.readFileSync(source, 'utf8');
      const result = injectPrivacyShield(original, shield);
      fs.writeFileSync(dest, result);
      console.log('Redion iOS: Datenschutzschirm ausschliesslich in AppDelegate installiert.');
    } catch (error) {
      console.error('Redion iOS: Datenschutzschirm nicht installiert:', error.message);
      process.exitCode = 1;
    }
  }
}
