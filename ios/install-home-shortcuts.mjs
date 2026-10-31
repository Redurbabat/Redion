/*
 * Native Redion app icon shortcuts, installed ONLY in the generated
 * Capacitor 8.5 SceneDelegate.swift / Info.plist by Codemagic.
 *
 * Never edit the tracked ios/ source directory, website or Xcode pbxproj.
 * Fail closed when the Capacitor template changes instead of guessing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const MARKER = '// REDION_NATIVE_HOME_SHORTCUTS';
const CONNECT = 'SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)';
const CLASS_NAME = 'class SceneDelegate: UIResponder, UIWindowSceneDelegate';
const METHOD = 'func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem';

export const SHORTCUTS = Object.freeze([
  { id: 'neu', title: 'Neue Seite', subtitle: 'Sofort losschreiben', icon: 'UIApplicationShortcutIconTypeCompose' },
  { id: 'dokumente', title: 'Dokumente', subtitle: 'Bibliothek öffnen', icon: 'UIApplicationShortcutIconTypeBookmark' },
  { id: 'heute', title: 'Heute', subtitle: 'Tagesübersicht öffnen', icon: 'UIApplicationShortcutIconTypeTime' },
  { id: 'lernen', title: 'Lernen', subtitle: 'Lernbereich öffnen', icon: 'UIApplicationShortcutIconTypePlay' }
]);

const SWIFT_HANDLER = `
${MARKER}
private final class RedionHomeShortcuts {
    static let shared = RedionHomeShortcuts()
    private var token = 0

    func open(_ shortcut: UIApplicationShortcutItem, window: UIWindow?) -> Bool {
        let actions = [
            "ch.redurbabat.redion.neu": "neu",
            "ch.redurbabat.redion.dokumente": "dokumente",
            "ch.redurbabat.redion.heute": "heute",
            "ch.redurbabat.redion.lernen": "lernen"
        ]
        guard let action = actions[shortcut.type] else { return false }
        token += 1
        deliver(action, window: window, token: token, tries: 0)
        return true
    }

    private func deliver(_ action: String, window: UIWindow?, token: Int, tries: Int) {
        guard self.token == token, tries < 65 else { return }
        guard let web = (window?.rootViewController as? CAPBridgeViewController)?.webView else {
            retry(action, window: window, token: token, tries: tries)
            return
        }
        // Action is selected from the fixed strings above, never user
        // input. JavaScript returns true only after the IPA bridge is loaded.
        let js = "Boolean(window.RedionNativeShortcut && window.RedionNativeShortcut.receive('" + action + "'))"
        web.evaluateJavaScript(js) { [weak self] result, error in
            if error == nil, let accepted = result as? Bool, accepted { return }
            self?.retry(action, window: window, token: token, tries: tries)
        }
    }

    private func retry(_ action: String, window: UIWindow?, token: Int, tries: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            self?.deliver(action, window: window, token: token, tries: tries + 1)
        }
    }
}
`.trim();

export function injectQuickActions(sceneSource) {
  if (typeof sceneSource !== 'string' ||
      !sceneSource.includes(CLASS_NAME) || !sceneSource.includes(CONNECT)) {
    throw new Error('Capacitor 8 UIScene-Vorlage fehlt oder wurde geändert.');
  }
  if (sceneSource.includes(MARKER) || sceneSource.includes(METHOD)) {
    throw new Error('Redion-Home-Schnellaktionen bereits eingebunden.');
  }
  if (!sceneSource.includes('import Capacitor') ||
      !sceneSource.includes('var window: UIWindow?') ||
      !sceneSource.trimEnd().endsWith('}')) {
    throw new Error('Unerwarteter Capacitor SceneDelegate-Aufbau.');
  }
  const inserted = sceneSource.replace(CONNECT, CONNECT + `
        if session.role == .windowApplication,
           let shortcut = connectionOptions.shortcutItem {
            _ = RedionHomeShortcuts.shared.open(shortcut, window: window)
        }`);
  const lastBrace = inserted.lastIndexOf('\n}');
  if (lastBrace < 0) throw new Error('SceneDelegate-Klassenende fehlt.');
  const method = `
    func windowScene(_ windowScene: UIWindowScene,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let handled = RedionHomeShortcuts.shared.open(shortcutItem, window: window)
        completionHandler(handled)
    }
`;
  return inserted.slice(0, lastBrace) + '\n' + method +
    inserted.slice(lastBrace).trimEnd() + '\n\n' + SWIFT_HANDLER + '\n';
}

export function plistCommands() {
  const commands = ['Add :UIApplicationShortcutItems array'];
  SHORTCUTS.forEach((entry, i) => {
    const prefix = ':UIApplicationShortcutItems:' + i;
    commands.push('Add ' + prefix + ' dict');
    commands.push('Add ' + prefix + ':UIApplicationShortcutItemType string ch.redurbabat.redion.' + entry.id);
    commands.push('Add ' + prefix + ':UIApplicationShortcutItemTitle string ' + entry.title);
    commands.push('Add ' + prefix + ':UIApplicationShortcutItemSubtitle string ' + entry.subtitle);
    commands.push('Add ' + prefix + ':UIApplicationShortcutItemIconType string ' + entry.icon);
  });
  return commands;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = process.cwd();
    const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
    if (config.appId !== 'ch.redurbabat.redion' ||
        config.ios?.path !== 'build/ios-capacitor') {
      throw new Error('App-ID oder nativer Buildpfad stimmt nicht.');
    }
    const project = path.join(root, config.ios.path, 'App', 'App');
    const swift = path.join(project, 'SceneDelegate.swift');
    const plist = path.join(project, 'Info.plist');
    if (!fs.existsSync(swift) || !fs.existsSync(plist)) {
      throw new Error('Capacitor SceneDelegate/Info.plist fehlen. Erfordert UIScene-Vorlage von Capacitor 8.5.');
    }
    const updated = injectQuickActions(fs.readFileSync(swift, 'utf8'));
    for (const cmd of plistCommands()) {
      execFileSync('/usr/libexec/PlistBuddy', ['-c', cmd, plist], { stdio: 'pipe' });
    }
    fs.writeFileSync(swift, updated);
    console.log('Redion iOS: ' + SHORTCUTS.length + ' Appsymbol-Schnellaktionen nativ eingerichtet.');
  } catch (error) {
    console.error('Redion iOS: Home-Schnellaktionen nicht eingebaut:', error.message);
    process.exitCode = 1;
  }
}
