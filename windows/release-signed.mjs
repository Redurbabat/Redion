/*
 * Explicit release-only Windows build. An ordinary local `npm run dist`
 * remains UNSIGNED and has NO active update feed.
 *
 * Signed release requires:
 *   REDION_UPDATE_URL=https://<public update host>/windows/
 *   REDION_WINDOWS_PUBLISHER=<Windows Authenticode certificate publisher>
 *   CSC_LINK=<signing certificate file or secret store reference>
 *   CSC_KEY_PASSWORD=<certificate password>
 *
 * No secrets are placed in the app, in Git, or in the update feed.
 * The generic HTTPS provider is intentionally not an upload mechanism.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { validUpdateUrl } = require('./update-policy.cjs');
const project = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));

export function releaseConfiguration(env = process.env) {
  const url = env.REDION_UPDATE_URL;
  const publisher = env.REDION_WINDOWS_PUBLISHER;
  if (!validUpdateUrl(url)) {
    throw new Error('REDION_UPDATE_URL muss eine öffentliche HTTPS-Adresse ohne Token sein.');
  }
  if (typeof publisher !== 'string' || !publisher.trim() ||
      /[\r\n]/.test(publisher)) {
    throw new Error('REDION_WINDOWS_PUBLISHER (Zertifikatsherausgeber) fehlt.');
  }
  if (!(env.CSC_LINK || env.WIN_CSC_LINK) ||
      !(env.CSC_KEY_PASSWORD || env.WIN_CSC_KEY_PASSWORD)) {
    throw new Error('Code-Signing-Zertifikat/Passwort fehlt. Keine unsignierten Auto-Updates.');
  }
  if (pkg.version === '2026.8.3') {
    throw new Error('Version vor Veröffentlichung über 2026.8.3 erhöhen.');
  }
  return {
    ...pkg.build,
    publish: [{ provider: 'generic', url }],
    win: {
      ...pkg.build.win,
      publisherName: publisher.trim(),
      verifyUpdateCodeSignature: true
    }
  };
}

function validateSignedInstaller(installer) {
  const escaped = installer.replaceAll("'", "''");
  const cmd = "(Get-AuthenticodeSignature -LiteralPath '" + escaped + "').Status";
  const value = execFileSync('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', cmd],
    { encoding: 'utf8', windowsHide: true }).trim();
  if (value !== 'Valid') throw new Error('Windows-Installer ist nicht Authenticode-valid: ' + value);
}

export async function buildSignedWindowsRelease() {
  if (process.platform !== 'win32') {
    throw new Error('Signierte Windows-Veröffentlichung muss auf Windows stattfinden.');
  }
  const config = releaseConfiguration();
  const { build, Platform, Arch } = require('electron-builder');
  await build({
    targets: Platform.WINDOWS.createTarget(['nsis'], Arch.x64),
    config,
    publish: 'always'
  });

  const output = path.resolve(project, '..', 'build/windows-dist');
  const installer = path.join(output, 'Redion Setup ' + pkg.version + '.exe');
  const latest = path.join(output, 'latest.yml');
  if (!fs.existsSync(installer) || !fs.existsSync(latest)) {
    throw new Error('Signierter Installer oder latest.yml fehlt. Nichts veröffentlichen.');
  }
  validateSignedInstaller(installer);
  const metadata = require('js-yaml').load(fs.readFileSync(latest, 'utf8'));
  if (metadata?.version !== pkg.version ||
      !metadata?.files?.some(file => file.sha512 && file.url?.endsWith('.exe'))) {
    throw new Error('Update-Metadaten unvollständig oder Version falsch.');
  }
  console.log('Redion: signierte NSIS-EXE + latest.yml geprüft.');
  console.log('Beide Dateien und die .blockmap-Datei erst nach Abnahme an den HTTPS-Host hochladen.');
  console.log('Keine Benutzerdateien wurden verändert; der Upload erfolgt NICHT automatisch.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSignedWindowsRelease().catch(error => {
    console.error('Redion-Autoupdate-Release abgebrochen:', error.message);
    process.exitCode = 1;
  });
}
