/** Der manuelle GitHub-Mac-Build benutzt exakt die Codemagic-Bauschritte.
 * Kein zweites IPA-Verfahren, keine neue Bundle-ID, keine Veröffentlichung. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export function extractBuildSteps(yaml: string): { name: string; script: string }[] {
  const lines = yaml.replace(/\r/g, '').split('\n');
  const start = lines.indexOf('    scripts:');
  const stop = lines.indexOf('    artifacts:', start);
  if (start < 0 || stop < start || !yaml.includes('  redion-ios-unsigned:')) throw new Error('Codemagic-Baustruktur unbekannt.');
  const steps: { name: string; script: string }[] = [];
  let step: { name: string; script: string } | undefined;
  for (const line of lines.slice(start + 1, stop)) {
    if (line.startsWith('      - name: ')) { step = { name: line.slice(14), script: '' }; steps.push(step); }
    else if (line === '        script: |') { if (!step) throw new Error('Bauschritt ohne Namen.'); }
    else if (line.startsWith('          ')) { if (!step) throw new Error('Skript ohne Bauschritt.'); step.script += line.slice(10) + '\n'; }
    else if (line.trim()) throw new Error('Nicht unterstützte Codemagic-Skriptform.');
  }
  if (!steps.length || steps.some(value => !value.script.trim()) || !steps.at(-1)?.script.includes('Redion-unsigned.ipa')) throw new Error('Unvollständiger IPA-Bau.');
  return steps;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.platform !== 'darwin') throw new Error('Der native iPhone-Bau benötigt macOS und Xcode.');
  const root = process.cwd();
  const steps = extractBuildSteps(fs.readFileSync(path.join(root, 'codemagic.yaml'), 'utf8'));
  for (const step of steps) {
    console.log('\nRedion iOS:', step.name);
    execFileSync('/bin/bash', ['-euo', 'pipefail', '-c', step.script], {
      cwd: root, stdio: 'inherit', env: { ...process.env, CM_BUILD_DIR: root }
    });
  }
}
