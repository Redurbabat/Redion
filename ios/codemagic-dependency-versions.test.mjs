/* Codemagic darf keine Node-Abhaengigkeit installieren, die Vites
 * optionalen Peer esbuild verletzt. Vite 8.3.1 verlangt ^0.27 || ^0.28.
 * Eigener Redion-Test ohne neue npm-Bibliothek; laeuft nach npm ci.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflow = fs.readFileSync(path.join(repo, 'codemagic.yaml'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
const lockfile = JSON.parse(fs.readFileSync(path.join(repo, 'package-lock.json'), 'utf8'));

/** Fuer esbuild-Versionen 0.x ist ^0.28.0 die 0.28.x-Reihe,
 * NICHT etwa 0.29.x. Die von Vite genannten Bereiche werden einzeln
 * geprueft, damit eine aeltere feste Version nicht unbemerkt zurueckkehrt.
 */
function versionInPeer(version, range) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(x => !Number.isSafeInteger(x))) return false;
  return range.split('||').some(text => {
    const match = text.trim().match(/^\^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return false;
    const [, major, minor, patch] = match.map(Number);
    const [vMajor, vMinor, vPatch] = parts;
    if (major === 0) return vMajor === 0 && vMinor === minor && vPatch >= patch;
    return vMajor === major && (vMinor > minor || (vMinor === minor && vPatch >= patch));
  });
}

test('Codemagic pinnt exakt ein esbuild im nativen Installationsschritt', () => {
  const pins = [...workflow.matchAll(/\besbuild@(\d+\.\d+\.\d+)\b/g)];
  assert.equal(pins.length, 1, 'Es muss exakt eine explizite esbuild-Version geben.');
  assert.match(workflow, /npm install --no-save --package-lock=false --no-audit --no-fund/);
  assert.match(workflow, /@capacitor\/core@8 @capacitor\/cli@8 @capacitor\/ios@8/);
  assert.match(workflow, /@capacitor\/filesystem@8 @capacitor\/share@8 @capacitor\/haptics@8 esbuild@/);
  assert.doesNotMatch(workflow, /--(?:force|legacy-peer-deps)\b/,
    'Kein unsicherer npm-Peer-Override.');
});

test('Die iOS-esbuild-Version erfuellt Vites Peer-Vertrag aus dem Lockfile', () => {
  const selected = [...workflow.matchAll(/\besbuild@(\d+\.\d+\.\d+)\b/g)][0]?.[1];
  assert.ok(selected, 'Pinned esbuild fehlt.');
  const vite = lockfile.packages?.['node_modules/vite'];
  assert.ok(vite, 'Das Vite-Paket fehlt im Lockfile.');
  assert.equal(vite.version, manifest.devDependencies.vite,
    'Vite aus package.json und package-lock.json muessen uebereinstimmen.');
  assert.equal(vite.peerDependenciesMeta?.esbuild?.optional, true,
    'Vites optionalen esbuild-Peer nie ungeprueft ueberschreiben.');
  assert.ok(versionInPeer(selected, vite.peerDependencies.esbuild),
    'Codemagic esbuild@' + selected + ' widerspricht Vite ' +
    vite.version + ' (erlaubt: ' + vite.peerDependencies.esbuild + ')');
});

test('Der Peer-Abgleich erfolgt vor dem TypeScript-Bau und dem Capacitor-Schritt', () => {
  const preflight = workflow.indexOf('node --test ios/codemagic-dependency-versions.test.mjs');
  const build = workflow.indexOf('npm run bauen:ts');
  const install = workflow.indexOf('npm install --no-save --package-lock=false');
  const bundling = workflow.indexOf('npx esbuild ios/native-sicherung.ts');
  assert.ok(preflight > 0 && preflight < build && build < install && install < bundling,
    'Tests muessen vor dem Webbau liegen, native Abhaengigkeiten vor esbuild.');
});
