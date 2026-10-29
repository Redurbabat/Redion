'use strict';
// The updater must never trust an insecure feed or an unsigned release.
// No tokens or URLs from the private GitHub repository belong in the app.
const fs = require('node:fs');
const path = require('node:path');

function validUpdateUrl(raw) {
  if (typeof raw !== 'string') return false;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && Boolean(url.hostname) &&
      !url.username && !url.password && !url.port &&
      !url.search && !url.hash && !url.hostname.endsWith('.local');
  } catch { return false; }
}

function validateUpdateConfig(resourcePath, yaml) {
  try {
    const data = yaml.load(fs.readFileSync(
      path.join(resourcePath, 'app-update.yml'), 'utf8'));
    if (!data || data.provider !== 'generic' ||
        !validUpdateUrl(data.url)) return false;
    const names = typeof data.publisherName === 'string'
      ? [data.publisherName] : data.publisherName;
    // Electron-updater verifies the downloaded NSIS Authenticode signature
    // against these publisher name(s). No publisher means NO updates.
    return Array.isArray(names) && names.length > 0 &&
      names.every(n => typeof n === 'string' && n.trim().length > 0) &&
      data.verifyUpdateCodeSignature !== false;
  } catch { return false; }
}

function updateEligible({ platform, packaged, portable, resourcePath, yaml }) {
  return platform === 'win32' && packaged === true && !portable &&
    typeof resourcePath === 'string' &&
    validateUpdateConfig(resourcePath, yaml);
}
module.exports = { validUpdateUrl, validateUpdateConfig, updateEligible };
