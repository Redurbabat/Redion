/** Lokale Bestandsaufnahme. Keine Netzwerkaufrufe, keine Geheimnisse,
 * kein Provisionieren und kein Einschalten des Abgleichs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function inspectSyncSetup(config: string, assetsIgnore: string) {
  const active = config.split(/\r?\n/).filter(line => !line.trimStart().startsWith('#')).join('\n');
  const section = (name: string) => active.match(new RegExp('\\[\\[' + name + '\\]\\]([^]*?)(?=\\n\\[|$)'))?.[1] || '';
  const db = section('d1_databases'), files = section('r2_buckets');
  const ignores = new Set(assetsIgnore.split(/\r?\n/).map(line => line.trim()));
  return {
    databaseConfigured: /binding\s*=\s*"DB"/.test(db) && /database_id\s*=\s*"[0-9a-f]{8}-[0-9a-f-]{27}"/i.test(db),
    attachmentsConfigured: /binding\s*=\s*"R2"/.test(files) && /bucket_name\s*=\s*"[^"\s]+"/.test(files),
    nativeBuildsExcluded: ['/windows/', '/ios/', '/build/', '/www/'].every(name => ignores.has(name)),
    unsafeOpenGate: /\bTOR\s*=\s*"offen"/.test(active),
    // Lokale Dateien können Konto, produktive Secrets, Access-Sitzungen,
    // CORS und einen echten Geräteversuch nicht bestätigen.
    liveServiceVerified: false,
    nativeAuthenticationVerified: false
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  const report = inspectSyncSetup(fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8'), fs.readFileSync(path.join(root, '.assetsignore'), 'utf8'));
  console.log(JSON.stringify(report, null, 2));
  console.log('Kein Live-Sync freigegeben. Anleitung: doku/SYNC-ERSTEINRICHTUNG.md');
}
