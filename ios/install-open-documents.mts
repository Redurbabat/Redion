import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const anchor = 'SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)';
const uri = 'SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)';
const marker = '// REDION_OPEN_DOCUMENTS';
export function injectOpenDocuments(source: string, helper: string): string {
  if (source.includes(marker) || source.split(anchor).length !== 2 || source.split(uri).length !== 2 ||
      !source.includes('// REDION_NATIVE_HOME_SHORTCUTS') || !helper.includes('final class RedionDocumentInbox')) throw new Error('Unbekannte oder bereits gepatchte iOS-Dokumentvorlage.');
  let result = source.replace(anchor, anchor + '\n        for context in connectionOptions.urlContexts { RedionDocumentInbox.shared.accept(context.url, window: window) }');
  result = result.replace(uri, 'for context in URLContexts { RedionDocumentInbox.shared.accept(context.url, window: window) }\n        ' + uri);
  const active = 'func sceneDidBecomeActive(_ scene: UIScene) {';
  if (result.includes(active)) result = result.replace(active, active + '\n        RedionDocumentInbox.shared.foreground(window: window)');
  else {
    const boundary = '\n}\n\n// REDION_NATIVE_HOME_SHORTCUTS';
    if (!result.includes(boundary)) throw new Error('SceneDelegate-Klassenende fehlt.');
    result = result.replace(boundary, '\n    func sceneDidBecomeActive(_ scene: UIScene) { RedionDocumentInbox.shared.foreground(window: window) }' + boundary);
  }
  if (!result.includes('import WebKit')) result = result.replace('import Capacitor', 'import Capacitor\nimport WebKit');
  return result + '\n' + marker + '\n' + helper;
}

export function documentPlistCommands(): string[] {
  // Alternate verhindert eine ungefragte Übernahme als Standard-PDF-App.
  const types = ['com.adobe.pdf', 'public.plain-text', 'public.image', 'ch.redurbabat.redion.backup'];
  return ['Add :CFBundleDocumentTypes array', ...types.flatMap((type, index) => {
    const key = ':CFBundleDocumentTypes:' + index;
    return ['Add ' + key + ' dict', 'Add ' + key + ':CFBundleTypeName string Redion-Dokument',
      'Add ' + key + ':LSHandlerRank string Alternate', 'Add ' + key + ':LSItemContentTypes array',
      'Add ' + key + ':LSItemContentTypes:0 string ' + type];
  }), 'Add :UTExportedTypeDeclarations array', 'Add :UTExportedTypeDeclarations:0 dict',
  'Add :UTExportedTypeDeclarations:0:UTTypeIdentifier string ch.redurbabat.redion.backup',
  'Add :UTExportedTypeDeclarations:0:UTTypeDescription string Redion-Sicherung',
  'Add :UTExportedTypeDeclarations:0:UTTypeConformsTo array',
  'Add :UTExportedTypeDeclarations:0:UTTypeConformsTo:0 string public.data',
  'Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification dict',
  'Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension array',
  'Add :UTExportedTypeDeclarations:0:UTTypeTagSpecification:public.filename-extension:0 string redion'];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  if (config.appId !== 'ch.redurbabat.redion' || config.ios?.path !== 'build/ios-capacitor') throw new Error('iOS-Identität verändert.');
  const target = path.join(root, config.ios.path, 'App/App');
  const swift = path.join(target, 'SceneDelegate.swift');
  const result = injectOpenDocuments(fs.readFileSync(swift, 'utf8'), fs.readFileSync(path.join(root, 'ios/native-documents.swift'), 'utf8'));
  for (const command of documentPlistCommands()) execFileSync('/usr/libexec/PlistBuddy', ['-c', command, path.join(target, 'Info.plist')]);
  fs.writeFileSync(swift, result);
  console.log('Redion iOS: koordinierte Dateiübernahme und Dokumenttypen eingerichtet.');
}
