/* Baut die echte native Brücke wie Codemagic, aber ohne Xcode/Installation.
 * Abhängigkeiten sind dieselben Buildwerkzeuge wie in codemagic.yaml.
 * Kein www/ im Arbeitsbaum und keine Dummy-Brücke, um Parität vorzutäuschen.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(import.meta.dirname, '..');
const dependencies = path.resolve(process.argv.find(a => a.startsWith('--dependencies='))?.slice('--dependencies='.length)
  || path.join(repo, 'bilder/workspace-2/native-build'));
const requireBuild = createRequire(path.join(dependencies, 'package.json'));
const build = requireBuild('esbuild').build as (options: Record<string, unknown>) => Promise<unknown>;
const { vergleicheWebstand } = await import(pathToFileURL(path.join(repo, 'ios/vergleiche-webstand.mjs')).href);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-workspace-parity-'));
try {
  fs.mkdirSync(path.join(scratch, 'www'));
  for (const name of ['index.html', 'sw.js', 'quell', 'oeffentlich', 'fremd', 'lernpakete', 'lernen']) {
    const source = path.join(repo, name);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, path.join(scratch, name), {recursive:true});
    fs.cpSync(source, path.join(scratch, 'www', name), {recursive:true});
  }
  fs.copyFileSync(path.join(repo, 'capacitor.config.json'), path.join(scratch, 'capacitor.config.json'));
  await build({
    entryPoints:[path.join(repo, 'ios/native-sicherung.ts')], bundle:true,
    platform:'browser', format:'iife', target:'es2022',
    nodePaths:[path.join(dependencies, 'node_modules')],
    outfile:path.join(scratch, 'www/redion-native-sicherung.js')
  });
  const prepare = spawnSync(process.execPath, [path.join(repo, 'ios/vorbereiten.mjs')], {cwd:scratch,encoding:'utf8'});
  assert.equal(prepare.status,0,prepare.stderr);
  const report = vergleicheWebstand(scratch);
  assert.equal(report.ergebnis,'identischer Webstand');
  assert.ok(report.webDateien>100,'Das vollständige Webpaket wird geprüft, nicht nur ein Modell');
  const changed = path.join(scratch,'www/quell/bereiche/wissen/bibliothek.js');
  fs.appendFileSync(changed,'\n/* isolierte Gegenprobe */');
  assert.throws(()=>vergleicheWebstand(scratch),/abweichende Inhalte.*bibliothek\.js/,
    'Eine abweichende iPhone-Bibliothek muss die Paritätsprüfung stoppen');
  const output = path.join(repo,'bilder/workspace-2/ios-web-paritaet.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify({...report,nativeBridge:'aus tatsächlichem ios/native-sicherung.ts gebaut',
    counterprobe:'abweichende Bibliothek erkannt', limitation:'Kein Xcode-Build und keine native Geräteabnahme auf Windows'},null,2)+'\n');
  console.log(`✓ ${report.webDateien} Webdateien bytegleich, echte native Brücke gebaut; Gegenprobe rot erkannt.`);
} finally {
  // Ausschliesslich der oben neu erzeugte, eindeutig abgegrenzte Prüfungsordner.
  assert.equal(path.dirname(scratch),path.resolve(os.tmpdir()));
  assert.ok(path.basename(scratch).startsWith('redion-workspace-parity-'));
  fs.rmSync(scratch,{recursive:true,force:true});
}
