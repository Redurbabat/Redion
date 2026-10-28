'use strict';
// All UI assets remain inside the read-only bundled Redion web directory.
// NEVER serve the application's writable userData/IndexedDB folder.
const path = require('node:path');
const fs = require('node:fs');

function resolveBundledAsset(root, urlString) {
  if (typeof urlString !== 'string') return null;
  let url;
  try { url = new URL(urlString); } catch { return null; }
  if (url.protocol !== 'redion-local:' || url.host !== 'app' ||
      url.username || url.password || url.port || url.search) return null;
  let requested;
  try { requested = decodeURIComponent(url.pathname); } catch { return null; }
  if (requested.includes('\\') || requested.includes('\0') ||
      requested.includes(':') || /%2f|%5c/i.test(url.pathname)) return null;
  const base = path.resolve(root);
  const file = path.resolve(base, '.' + (requested === '/' ? '/index.html' : requested));
  const relative = path.relative(base, file);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  // Symlinks may not lead outside the bundled immutable app assets.
  try {
    const real = fs.realpathSync(file);
    const offset = path.relative(base, real);
    if (!offset || offset.startsWith('..') || path.isAbsolute(offset) ||
        !fs.statSync(real).isFile()) return null;
    return real;
  } catch { return null; }
}
module.exports = { resolveBundledAsset };
