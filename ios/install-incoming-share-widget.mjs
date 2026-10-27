/*
 * Inject the receive-only App Group bridge into Capacitor's generated
 * SceneDelegate AFTER Redion's existing Quick Actions installer.
 * No Xcode project edits or modifications to ios/ tracked Swift sources.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GROUP = 'group.ch.redurbabat.redion.share';
const ANCHOR = 'SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)';
const MARKER = '// REDION_INCOMING_SHARE_WIDGET';
const URI = 'SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)';

const HELPER = `
${MARKER}
// Acknowledges a share only AFTER Redion's IndexedDB flush has resolved.
private final class RedionIncomingInbox {
    static let shared = RedionIncomingInbox()
    private let group = "${GROUP}"
    private var inFlight = Set<String>()
    private var attempts = 0

    // A failed WebKit startup must never exhaust future shares forever.
    // Every real foreground transition gets a fresh bounded retry budget.
    func foreground(window: UIWindow?) {
        attempts = 0
        drain(window: window)
    }

    func drain(window: UIWindow?) {
        guard let web = (window?.rootViewController as? CAPBridgeViewController)?.webView,
              let container = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: group) else { return }
        let inbox = container.appendingPathComponent("Inbox", isDirectory: true)
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: inbox, includingPropertiesForKeys: nil) else { return }
        for file in files.filter({ $0.pathExtension == "json" }).sorted(by: { $0.lastPathComponent < $1.lastPathComponent }).prefix(12) {
            let name = file.lastPathComponent
            guard !inFlight.contains(name),
                  let data = try? Data(contentsOf: file),
                  data.count <= 100_000,
                  let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let id = object["id"] as? String,
                  name == id + ".json",
                  let kind = object["kind"] as? String,
                  ["text", "url"].contains(kind),
                  object["value"] is String else { continue }
            inFlight.insert(name)
            web.callAsyncJavaScript(
                "return await (window.RedionNativeShare?.receive(payload) ?? false)",
                arguments: ["payload": object], in: nil, contentWorld: .page
            ) { [weak self] result in
                guard let self = self else { return }
                self.inFlight.remove(name)
                if case .success(let value) = result, let accepted = value as? Bool, accepted {
                    self.attempts = 0
                    try? FileManager.default.removeItem(at: file)
                } else if self.attempts < 45 {
                    self.attempts += 1
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { [weak self] in
                        self?.drain(window: window)
                    }
                }
            }
        }
    }
}
`.trim();

export function injectIncomingShareWidget(scene) {
  if (typeof scene !== 'string' ||
      !scene.includes('// REDION_NATIVE_HOME_SHORTCUTS') ||
      !scene.includes(ANCHOR) || !scene.includes(URI)) {
    throw new Error('UIScene ist nicht für Redions native Schnellaktionen vorbereitet.');
  }
  if (scene.includes(MARKER) || scene.includes('redion://widget')) {
    throw new Error('Share-/Widget-Bridge bereits eingebaut.');
  }
  const oldClose = '\n}\n\n// REDION_NATIVE_HOME_SHORTCUTS';
  if (scene.split(oldClose).length !== 2) {
    throw new Error('Redion-SceneDelegate-Klassenende fehlt oder ist mehrdeutig.');
  }
  let out = scene.includes('import WebKit') ? scene : scene.replace('import Capacitor', 'import Capacitor\\nimport WebKit');
  out = out.replace(ANCHOR, ANCHOR + `
        // Cold-start deep links arrive here, not in openURLContexts.
        for context in connectionOptions.urlContexts {
            routeRedionWidget(context.url)
        }
        DispatchQueue.main.async {
            RedionIncomingInbox.shared.drain(window: self.window)
        }`);
  out = out.replace(URI, `for context in URLContexts {
            routeRedionWidget(context.url)
        }
        ${URI}`);
  out = out.replace(oldClose, `
    private func routeRedionWidget(_ url: URL) {
        guard url.scheme == "redion", url.host == "widget" else { return }
        let action = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard ["dokumente", "heute", "lernen"].contains(action) else { return }
        let item = UIApplicationShortcutItem(
            type: "ch.redurbabat.redion." + action, localizedTitle: "Redion")
        _ = RedionHomeShortcuts.shared.open(item, window: window)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        RedionIncomingInbox.shared.foreground(window: window)
    }
}

// REDION_NATIVE_HOME_SHORTCUTS`);
  return out.trimEnd() + '\n\n' + HELPER + '\n';
}

export function installIncomingShareWidget(root = process.cwd()) {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  if (cfg.appId !== 'ch.redurbabat.redion' || cfg.ios?.path !== 'build/ios-capacitor') {
    throw new Error('App-ID oder Xcode-Buildpfad weicht ab.');
  }
  const scene = path.join(root, cfg.ios.path, 'App/App/SceneDelegate.swift');
  const source = fs.readFileSync(scene, 'utf8');
  const patched = injectIncomingShareWidget(source);
  fs.writeFileSync(scene, patched);
  return scene;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log('Redion: native Share-/Widget-Bridge installiert:', installIncomingShareWidget()); }
  catch (e) { console.error('Redion: native Share-/Widget-Bridge fehlt:', e.message); process.exitCode = 1; }
}
