import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Die Callback-API heißt in Swift in:in:completionHandler:. contentWorld:
// gehört zur async/await-Überladung und nimmt keine Abschluss-Closure an.
const sources = ['native-documents.swift', 'install-incoming-share-widget.mjs'].map(name => ({
  name, text: fs.readFileSync(new URL(name, import.meta.url), 'utf8')
}));
function callPrefix(source: string): string {
  const prefix = source.match(/web\.callAsyncJavaScript\([\s\S]*?(?=\{\s*\[weak self\])/u)?.[0];
  assert.ok(prefix, 'Der tatsächlich injizierte WebKit-Aufruf muss gefunden werden.');
  return prefix;
}

for (const source of sources) test(source.name + ': WebKit-Callback hat die korrekten Swift-Argumentnamen', () => {
  const call = callPrefix(source.text);
  assert.match(call, /in:\s*nil,\s*in:\s*\.page,\s*completionHandler:\s*$/u);
  assert.doesNotMatch(call, /contentWorld:/u);
  assert.match(source.text, /if case \.success\(let value\) = result/u);
});

test('echtes iPhone-SDK prüft beide Callback-Aufrufe semantisch', { skip: process.platform !== 'darwin' }, () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-webkit-contract-'));
  try {
    const sdk = execFileSync('xcrun', ['--sdk', 'iphoneos', '--show-sdk-path'], { encoding: 'utf8' }).trim();
    const probe = 'import WebKit\n' + sources.map((source, index) =>
      '@MainActor func probe' + index + '(_ web: WKWebView, payload: [String: Any], object: [String: Any]) {\n' +
      callPrefix(source.text) + '{ result in _ = result })\n}\n').join('\n');
    const filename = path.join(temporary, 'WebKitCallContract.swift');
    fs.writeFileSync(filename, probe);
    execFileSync('xcrun', ['--sdk', 'iphoneos', 'swiftc', '-typecheck', '-swift-version', '5',
      '-sdk', sdk, '-target', 'arm64-apple-ios15.0', '-module-cache-path', path.join(temporary, 'ModuleCache'), filename],
      { stdio: 'pipe', timeout: 120000 });
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
