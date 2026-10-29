import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const folders = ['quell', 'oeffentlich', 'fremd', 'lernpakete', 'lernen'];
const list = (root: string, prefix = ''): string[] => fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
  const name = path.posix.join(prefix, entry.name);
  if (entry.isSymbolicLink()) throw new Error('Symlink im Web-Paket.');
  return entry.isDirectory() ? list(path.join(root, entry.name), name) : [name];
}).sort();
export function compareWindowsWeb(root: string, target: string) {
  const expected = ['index.html', 'sw.js', ...folders.flatMap(folder =>
    fs.existsSync(path.join(root, folder)) ? list(path.join(root, folder), folder) : [])].sort();
  const found = list(target);
  if (JSON.stringify(expected) !== JSON.stringify(found)) throw new Error('Windows-Webpaket enthält fehlende oder veraltete Dateien.');
  const files = expected.map(name => {
    const source = fs.readFileSync(path.join(root, name));
    const copy = fs.readFileSync(path.join(target, name));
    if (!source.equals(copy)) throw new Error('Abweichender Windows-Web-Code: ' + name);
    return { path: name, sha256: crypto.createHash('sha256').update(source).digest('hex') };
  });
  return { identical: true, files };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const report = compareWindowsWeb(root, path.join(root, 'build/windows-app'));
  fs.mkdirSync(path.join(root, 'build/windows-dist'), { recursive: true });
  fs.writeFileSync(path.join(root, 'build/windows-dist/windows-web-paritaet.json'), JSON.stringify(report, null, 2));
  console.log('Windows-Web-Parität:', report.files.length, 'Dateien bytegleich.');
}
