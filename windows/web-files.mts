import fs from 'node:fs';
import path from 'node:path';

/**
 * Top-level assets referenced by index.html, in addition to the known web
 * directories. The desktop build must not silently omit newly added root JS.
 * Never copy arbitrary files (.env, keys, source) into a public app package.
 */
export const webFolders = Object.freeze(['quell', 'oeffentlich', 'fremd', 'lernpakete', 'lernen']);

export function webRootFiles(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const names = new Set(['index.html', 'sw.js', 'version.json', 'version.md']);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"[^>]*>/gi)) {
    const url = match[1];
    if (!url || url.includes('/') || url.startsWith('.') || url.includes('\\')) continue;
    if (/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:js|css)$/.test(url)) names.add(url);
  }
  return [...names].sort();
}
