/* Redion: Lokale Windows-Pruefung mit dauerhaftem, ungekuerztem Log.
 *
 * Das bestehende .bat entscheidet ueber Branch, Reihenfolge und Abbruch.
 * Dieses Hilfsprogramm streamt nur die unveraenderte Ausgabe EINES Schritts
 * gleichzeitig auf den Bildschirm und in ein Protokoll.
 *
 * Aufruf: node windows/schaltplan-protokoll.mjs --start
 *         node windows/schaltplan-protokoll.mjs -- npm run typecheck
 *         node windows/schaltplan-protokoll.mjs -- node pruefungen/lauf/test635.mts
 *         node windows/schaltplan-protokoll.mjs --where
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const report = path.join(os.homedir(), 'Redion-Schaltplan-Pruefung.log');
const option = process.argv[2];

if (option === '--start') {
  try {
    fs.writeFileSync(report,
      'REDION-SCHALTPLAN-PRUEFUNG\nBeginn: ' + new Date().toISOString() +
      '\nBetriebssystem: ' + process.platform + '\nNode: ' + process.version +
      '\nOrdner: ' + process.cwd() + '\n\n', 'utf8');
    console.log('Protokoll: ' + report);
  } catch (error) {
    console.error('Pruefprotokoll konnte nicht angelegt werden:', error.message);
    process.exitCode = 1;
  }
} else if (option === '--where') {
  console.log(report);
} else if (option === '--') {
  const [command, ...args] = process.argv.slice(3);
  if (!command || !['npm', 'npx', 'node'].includes(command)) {
    console.error('Unzulaessiger Pruefbefehl. Erlaubt sind npm, npx und node.');
    process.exitCode = 2;
  } else {
    const executable = command === 'node' ? process.execPath :
      process.platform === 'win32' ? command + '.cmd' : command;
    const heading = '\n--- ' + [command, ...args].join(' ') + ' ---\n';
    try {
      fs.appendFileSync(report, heading, 'utf8');
      process.stdout.write(heading);
      const log = fs.createWriteStream(report, { flags: 'a' });
      const child = spawn(executable, args, {
        cwd: process.cwd(),
        shell: process.platform === 'win32' && command !== 'node',
        stdio: ['inherit', 'pipe', 'pipe'],
        windowsHide: false
      });
      child.stdout.on('data', data => {
        process.stdout.write(data);
        log.write(data);
      });
      child.stderr.on('data', data => {
        process.stderr.write(data);
        log.write(data);
      });
      const result = await new Promise(resolve => {
        let finished = false;
        child.once('error', error => {
          if (finished) return;
          finished = true;
          const info = '[FEHLER] Start fehlgeschlagen: ' + error.message + '\n';
          process.stderr.write(info);
          log.write(info);
          resolve(1);
        });
        child.once('close', (code, signal) => {
          if (finished) return;
          finished = true;
          resolve(code === 0 && !signal ? 0 : (code || 1));
        });
      });
      const footer = '\n--- Ergebnis: ' + (result === 0 ? 'BESTANDEN' : 'FEHLER') +
        ' (Exit ' + result + ') ---\n';
      process.stdout.write(footer);
      await new Promise((resolve, reject) => {
        log.end(footer, error => error ? reject(error) : resolve());
      });
      process.exitCode = result === 0 ? 0 : 1;
    } catch (error) {
      console.error('Pruefschritt konnte nicht protokolliert werden:', error.message);
      process.exitCode = 1;
    }
  }
} else {
  console.error('Aufruf: --start, --where oder -- <npm|npx|node> <args...>');
  process.exitCode = 2;
}
