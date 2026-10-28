/**
 * Redion iPhone ↔ Windows Sync: non-destructive readiness inspector.
 *
 * This deliberately never calls Cloudflare, uploads data, changes wrangler.toml,
 * creates D1/R2 resources or touches the iPhone/Windows IndexedDB profiles.
 *
 * Run: node tools/sync-readiness.mjs
 *      node tools/sync-readiness.mjs --json
 *      node tools/sync-readiness.mjs --strict
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Strip TOML comments without losing literal # inside quoted values. */
function withoutComment(line) {
  let quote = '';
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && quote === '"') { escaped = true; continue; }
    if ((c === '"' || c === "'") && (!quote || quote === c)) {
      quote = quote ? '' : c;
    } else if (c === '#' && !quote) return line.slice(0, i);
  }
  return line;
}

/** Conservative TOML scanner for Wrangler's D1/R2 array-of-table bindings. */
export function workerBindings(toml) {
  const values = { d1_databases: [], r2_buckets: [] };
  let current = null;
  for (const raw of String(toml).split(/\r?\n/)) {
    const line = withoutComment(raw).trim();
    if (!line) continue;
    const array = line.match(/^\[\[([a-zA-Z0-9_-]+)\]\]$/);
    if (array) {
      current = Object.hasOwn(values, array[1]) ? {} : null;
      if (current) values[array[1]].push(current);
      continue;
    }
    if (/^\[/.test(line)) { current = null; continue; }
    if (!current) continue;
    const pair = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.*)$/);
    if (!pair) continue;
    const text = pair[2].trim();
    const q = text[0];
    if ((q === '"' || q === "'") && text.endsWith(q) && text.length > 1) {
      current[pair[1]] = text.slice(1, -1);
    } else {
      current[pair[1]] = text;
    }
  }
  return values;
}

function flag(id, ready, detail) { return { id, ready: Boolean(ready), detail }; }

export function assessSyncReadiness({ toml, fileExists = () => false }) {
  const blocks = workerBindings(toml);
  const db = blocks.d1_databases;
  const r2 = blocks.r2_buckets;
  const d1ok = db.length === 1 && db[0].binding === 'DB' &&
    db[0].database_name === 'redion' && UUID.test(db[0].database_id || '');
  const r2ok = r2.length === 1 && r2[0].binding === 'R2' &&
    r2[0].bucket_name === 'redion-dateien';

  const checks = [
    flag('d1', d1ok, d1ok
      ? 'Eine D1-Bindung mit gültiger UUID ist eingetragen. Das Cloudflare-Konto muss separat geprüft werden.'
      : 'D1-Bindung fehlt, ist mehrdeutig oder hat keinen gültigen DB-/redion-/UUID-Eintrag.'),
    flag('r2', r2ok, r2ok
      ? 'Der R2-Bucket ist konfiguriert. Existenz im richtigen Cloudflare-Konto noch prüfen.'
      : 'R2-Bindung fehlt, ist mehrdeutig oder verweist nicht auf R2/redion-dateien.'),
    flag('server', [
      'server/schema.sql', 'server/cloudflare.ts',
      'server/kern.ts', 'server/dateien.ts', 'worker.ts',
      'server/sicherheit/tor.ts'
    ].every(fileExists),
      'Backend-Dateien für Sync, D1/R2 und Zugangskontrolle müssen vorhanden sein.'),
    flag('ios', [
      'ios/native-sicherung.ts', 'src/kern/abgleich/maschine.ts'
    ].every(fileExists),
      'Die iPhone-App muss die native Sicherung und den gemeinsamen Sync-Kern besitzen.'),
    flag('windows', [
      'windows/main.cjs', 'windows/package.json',
      'src/kern/abgleich/maschine.ts'
    ].every(fileExists),
      'Die Windows-App und der gemeinsame Sync-Kern müssen vorhanden sein.'),
    flag('nativeApi', fileExists('server/native-sync-worker.ts'),
      'Ein separat gesicherter, echtgerätgetesteter nativer API-Zugang ohne Öffnung des Cloudflare-Access-Tors fehlt noch.'),
    flag('iphoneIcloud', fileExists('ios/icloud-backup-bridge.swift'),
      'Eine native, signierte iCloud-Drive-Backupbrücke mit passenden Apple-Entitlements ist noch nicht erstellt.')
  ];
  return {
    ready: checks.every(x => x.ready),
    checks,
    commands: [
      'npx wrangler whoami --json',
      'npx wrangler d1 list --json',
      'npx wrangler r2 bucket list'
    ],
    instructions: [
      'Erst das Cloudflare-Konto bestätigen, in dem der Worker red-ion betrieben wird.',
      'Nicht die alte D1-ID aus den Kommentaren aktivieren: sie stammt aus einem anderen Konto.',
      'D1/R2 nur nach Kontoprüfung im richtigen Konto anlegen/zuordnen; Schema zuerst an einem Testbestand prüfen.',
      'Für iPhone und Windows einen eigenen sicheren Native-API-Zugang entwickeln und abnehmen.',
      'Vor dem ersten Abgleich auf beiden Geräten vollständige externe .redion-Sicherungen prüfen.',
      'Automatische iCloud-Backups erfordern native Apple-Berechtigungen und echte Geräteabnahme.'
    ]
  };
}

export function readLocalReadiness(projectRoot = root) {
  const toml = fs.readFileSync(path.join(projectRoot, 'wrangler.toml'), 'utf8');
  return assessSyncReadiness({
    toml,
    fileExists: name => fs.existsSync(path.join(projectRoot, name))
  });
}

export function reportText(report) {
  const rows = ['Redion – iPhone/Windows-Synchronisierung: sichere Vorprüfung', ''];
  for (const check of report.checks) {
    rows.push((check.ready ? '[OK] ' : '[OFFEN] ') +
      check.id + ': ' + check.detail);
  }
  rows.push('', report.ready
    ? 'Lokale Voraussetzungen gefunden. Echtes Cloudflare- und Geräteverhalten trotzdem vor Freigabe prüfen.'
    : 'Noch NICHT produktionsbereit. Es wurde nichts geändert.');
  rows.push('', 'Cloudflare nur LESEND prüfen (keine Daten verändern):');
  for (const command of report.commands) rows.push('  ' + command);
  rows.push('', 'Nächste sichere Schritte:');
  for (const note of report.instructions) rows.push('  - ' + note);
  return rows.join('\n');
}

const invoked = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  try {
    const report = readLocalReadiness();
    console.log(process.argv.includes('--json')
      ? JSON.stringify(report, null, 2)
      : reportText(report));
    if (process.argv.includes('--strict') && !report.ready) process.exitCode = 1;
  } catch (error) {
    console.error('Redion Sync-Vorprüfung nicht möglich:', error.message);
    process.exitCode = 1;
  }
}
