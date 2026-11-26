import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHORTCUT_TABS, createHomeShortcutRouter } from './home-shortcuts.mjs';
import { SHORTCUTS, injectQuickActions, plistCommands } from './install-home-shortcuts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function setup(ready = () => true) {
  let currentTime = 1000;
  let next = 0;
  const tasks = new Map();
  const clicked = [];
  const buttons = Object.fromEntries(Object.values(SHORTCUT_TABS).map(id => [id, {
    isConnected: true, disabled: false, click() { clicked.push(id); }
  }]));
  const doc = {
    readyState: 'loading',
    hidden: false,
    getElementById(id) { return buttons[id] ?? null; }
  };
  const route = createHomeShortcutRouter({
    document: doc,
    ready,
    now: () => currentTime,
    schedule(fn) { const id = ++next; tasks.set(id, fn); return id; },
    cancel(id) { tasks.delete(id); }
  });
  const tick = () => {
    const nextTask = [...tasks.entries()][0];
    if (!nextTask) return false;
    tasks.delete(nextTask[0]);
    nextTask[1]();
    return true;
  };
  return { route, doc, buttons, clicked, tasks, tick, time(ms) { currentTime += ms; } };
}

test('iPhone Appsymbol bietet vier echte Redion-Wege an', () => {
  assert.deepEqual(Object.keys(SHORTCUT_TABS), ['neu', 'dokumente', 'heute', 'lernen']);
  assert.deepEqual(SHORTCUTS.map(x => x.id), Object.keys(SHORTCUT_TABS));
  assert.deepEqual(Object.values(SHORTCUT_TABS), ['btn-new-bottom', 'hl-dok', 'hl-start', 'hl-lernen']);
});

test('Kaltstart wartet, bis die Originalnavigation klickbereit ist', () => {
  const x = setup();
  assert.equal(x.route.receive('dokumente'), true);
  x.tick(); x.tick(); x.tick();
  assert.deepEqual(x.clicked, [], 'Vor Web-App-Ladeabschluss nie navigieren');
  x.doc.readyState = 'complete';
  x.tick();
  assert.deepEqual(x.clicked, ['hl-dok'], 'Es wird der bestehende Dock-Button verwendet');
  x.route.stop();
});

test('Warmstart wechselt über vorhandene Tab-Buttons ohne zweiten Router', () => {
  const x = setup();
  x.doc.readyState = 'complete';
  assert.equal(x.route.receive('heute'), true);
  x.tick(); x.tick(); x.tick();
  assert.deepEqual(x.clicked, ['hl-start']);
  x.time(800);
  assert.equal(x.route.receive('lernen'), true);
  x.tick(); x.tick(); x.tick();
  assert.deepEqual(x.clicked, ['hl-start', 'hl-lernen']);
  x.route.stop();
});

test('Doppelte oder unbekannte Shortcut-Befehle ändern nichts', () => {
  const x = setup();
  x.doc.readyState = 'complete';
  assert.equal(x.route.receive('__proto__'), false);
  assert.equal(x.route.receive('notiz-loeschen'), false);
  assert.equal(x.tasks.size, 0);
  x.route.receive('dokumente');
  x.route.receive('dokumente');
  x.tick(); x.tick(); x.tick();
  assert.deepEqual(x.clicked, ['hl-dok']);
  x.route.receive('dokumente');
  x.tick(); x.tick(); x.tick();
  assert.deepEqual(x.clicked, ['hl-dok'], 'Wiederholter Systemcallback wird gedrosselt');
  x.route.stop();
});

test('Letzte Aktion gewinnt, wenn während des Ladens ein anderes Ziel gewählt wird', () => {
  const x = setup();
  x.route.receive('heute');
  x.route.receive('lernen');
  x.doc.readyState = 'complete';
  x.tick(); x.tick(); x.tick();
  assert.deepEqual(x.clicked, ['hl-lernen']);
  x.route.stop();
});

test('Ungültige Oberflächen oder geschlossene App werden nicht bedient', () => {
  const x = setup();
  x.doc.readyState = 'complete';
  x.buttons['hl-dok'].disabled = true;
  x.route.receive('dokumente');
  x.tick(); x.tick(); x.tick();
  assert.equal(x.clicked.length, 0);
  x.route.stop();
  assert.equal(x.tasks.size, 0);
  assert.equal(x.route.receive('lernen'), false);
});

const scene = `import UIKit
import Capacitor
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }
}
`;

test('Swift SceneDelegate empfängt Warm- und Kaltstart-Schnellaktionen', () => {
  const swift = injectQuickActions(scene);
  assert.match(swift, /connectionOptions\.shortcutItem/);
  assert.match(swift, /session\.role == \.windowApplication/);
  assert.match(swift, /windowScene\(_ windowScene: UIWindowScene,/);
  assert.match(swift, /completionHandler\(handled\)/);
  assert.match(swift, /web\.evaluateJavaScript\(js\)/);
  assert.match(swift, /private final class RedionHomeShortcuts/);
  assert.match(swift, /REDION_NATIVE_HOME_SHORTCUTS/);
  assert.doesNotMatch(swift, /\(MARKER\)/);
  assert.throws(() => injectQuickActions(swift), /bereits eingebunden/);
});

test('Veränderte UIScene-Templates werden nicht blind gepatcht', () => {
  assert.throws(() => injectQuickActions('import UIKit'), /UIScene-Vorlage/);
  assert.throws(() => injectQuickActions(scene.replace('import Capacitor', '')), /SceneDelegate-Aufbau/);
  assert.throws(() => injectQuickActions(scene.replace('var window: UIWindow?', '')), /SceneDelegate-Aufbau/);
});

test('Info.plist definiert sichere, feste Home-Screen-Kurzbefehle', () => {
  const cmds = plistCommands();
  assert.equal(cmds[0], 'Add :UIApplicationShortcutItems array');
  assert.equal(cmds.length, 1 + 4 * 5);
  for (const id of Object.keys(SHORTCUT_TABS)) {
    assert.ok(cmds.some(v => v.endsWith('ch.redurbabat.redion.' + id)));
  }
  assert.ok(cmds.every(v => !/\n|[;"'\x00]/.test(v)), 'Keine Shell-Zeichen in statischen Plist-Optionen');
});

test('Nur native Buildartefakte; gemeinsamer Webcode bleibt unberührt', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  const yaml = fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8');
  const website = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const native = fs.readFileSync(path.join(root, 'ios/native-sicherung.ts'), 'utf8');
  assert.equal(cfg.appId, 'ch.redurbabat.redion');
  assert.equal(cfg.ios.path, 'build/ios-capacitor');
  assert.match(yaml, /node ios\/install-home-shortcuts\.mjs/);
  assert.match(yaml, /node --test ios\/home-shortcuts\.test\.mjs/);
  assert.match(native, /createHomeShortcutRouter\(\{ document, ready: \(\) => readiness\.ready\(\) \}\)/);
  assert.doesNotMatch(website, /RedionNativeShortcut|home-shortcuts\.mjs/);
});

/* Die PlistBuddy-Zeilen laufen nur auf dem Mac. Am 31. Oktober 2026 prüfte der
 * Bauschritt noch die alte Reihenfolge und brach die IPA mit Status 1 ab, während
 * jeder Test unter Windows grün war. Hier wird sein Text gegen die Liste gehalten. */
test('der Codemagic-Schritt prüft die Schnellaktionen in ihrer echten Reihenfolge', async () => {
  const fs = await import('node:fs');
  const yaml = fs.readFileSync(new URL('../codemagic.yaml', import.meta.url), 'utf8');
  const proben = [...yaml.matchAll(/UIApplicationShortcutItems:(\d+):UIApplicationShortcutItemType'[^\n]*\n\s*grep -qx 'ch\.redurbabat\.redion\.(\w+)'/g)];
  assert.ok(proben.length >= 2, 'der Schritt prüft mindestens den ersten und den letzten Eintrag');
  for (const [, nummer, id] of proben) assert.equal(SHORTCUTS[Number(nummer)]?.id, id);
  assert.ok(proben.some(([, nummer]) => Number(nummer) === SHORTCUTS.length - 1), 'auch der letzte Eintrag wird geprüft');
});

test('home shortcuts and widget deep links wait for the local store and unlock', () => {
  let loaded=false;
  const x=setup(()=>loaded);
  x.doc.readyState='complete';
  x.route.receive('neu');
  x.tick();x.tick();x.tick();
  assert.deepEqual(x.clicked,[]);
  loaded=true;
  x.buttons.sperrschirm={isConnected:true};
  x.tick();
  assert.deepEqual(x.clicked,[]);
  delete x.buttons.sperrschirm;
  x.tick();
  assert.deepEqual(x.clicked,['btn-new-bottom']);
  x.route.stop();
});

test('native shortcut fails closed when readiness throws or action is aria-disabled', () => {
  let loaded=false;
  const x=setup(()=>{if(!loaded)throw new Error('not initialized');return true;});
  x.doc.readyState='complete';
  x.route.receive('dokumente');
  x.tick();x.tick();x.tick();
  assert.deepEqual(x.clicked,[]);
  loaded=true;
  x.buttons['hl-dok'].getAttribute=()=> 'true';
  x.tick();
  assert.deepEqual(x.clicked,[]);
  x.buttons['hl-dok'].getAttribute=()=>null;
  x.tick();
  assert.deepEqual(x.clicked,['hl-dok']);
  x.route.stop();
});
