/* Regression: PR207-Doppelklick darf nie still eine alte App oeffnen.
 * Statische cmd.exe-Vertragspruefung ohne Windows-Electron-Abhaengigkeit.
 *
 *   node --test windows/pr207-launcher.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = fs.readFileSync(path.join(root, 'Redion-PR207-Live.bat'), 'utf8');
const live = fs.readFileSync(path.join(root, 'Redion-Live.bat'), 'utf8');
const check = fs.readFileSync(path.join(root, 'Redion-Schaltplan-Pruefen.bat'), 'utf8');
const pull = fs.readFileSync(path.join(root, 'holen.bat'), 'utf8');

test('PR207-Live verwendet den einzigen sicheren Hol-Ablauf', () => {
  assert.match(launcher, /set "ZIEL=ux\/windows-schaltplan-dock-20261108"/);
  assert.match(launcher, /call "%~dp0holen\.bat" "%ZIEL%"/);
  assert.doesNotMatch(launcher, /^\s*git\s+(?:checkout|reset|stash|push|merge)\b/im);
  assert.doesNotMatch(launcher, /call "%~dp0holen\.bat" "main"/i);
});

test('PR207-Live kontrolliert Branch und GitHub-Commit vor dem Start', () => {
  const fetch = launcher.indexOf('call "%~dp0holen.bat" "%ZIEL%"');
  const branch = launcher.indexOf('if /I not "%LOKALZWEIG%"=="%ZIEL%"');
  const remote = launcher.indexOf('git ls-remote --heads origin "refs/heads/%ZIEL%"');
  const hash = launcher.indexOf('if /I not "%LOKALSHA%"=="%REMOTESHA%"');
  const launch = launcher.indexOf('call "%~dp0Redion-Live.bat"');
  assert.ok(fetch >= 0 && branch > fetch && remote > branch &&
    hash > remote && launch > hash, 'Hol- und SHA-Pruefung muss vor Electron liegen');
  assert.match(launcher, /if not defined REMOTESHA \(/);
  assert.match(launcher, /if errorlevel 1 goto fehlgeschlagen/);
  const diff = launcher.indexOf('git diff --quiet');
  const staged = launcher.indexOf('git diff --cached --quiet');
  assert.ok(diff > hash && staged > diff && launch > staged,
    'Der Starter darf auch bei ungesicherten getrackten Aenderungen nicht oeffnen');
});

test('Abgelehnte rote CI-Warnung stoppt Live selbst bei gleichem SHA', () => {
  const call = launcher.indexOf('call "%~dp0holen.bat" "%ZIEL%"');
  const reset = launcher.indexOf('set "REDION_HOLEN_ERFOLG="');
  const consent = launcher.indexOf('if not "%REDION_HOLEN_ERFOLG%"=="1"');
  const hash = launcher.indexOf('if /I not "%LOKALSHA%"=="%REMOTESHA%"');
  const start = launcher.indexOf('call "%~dp0Redion-Live.bat"');
  assert.ok(reset >= 0 && reset < call && consent > call &&
    consent < hash && hash < start,
    'Ein abgebrochener Holvorgang muss vor den SHA-Pruefungen stoppen');
  assert.match(launcher, /Hol[e]?n abgebrochen oder fehlgeschlagen|Holen abgebrochen oder fehlgeschlagen/);
  // holen.bat hat kein setlocal: das Erfolgssignal ist fuer call() sichtbar.
  // Es steht am Anfang leer, wird aber nur an den ZWEI normalen
  // Erfolgsenden gesetzt (bereits synchron / erfolgreich eingecheckt).
  const resetInPull = pull.indexOf('set "REDION_HOLEN_ERFOLG="');
  const choices = [...pull.matchAll(/choice \/c JN[^\n]*\n\s*if errorlevel 2 goto ende/g)];
  const successes = [...pull.matchAll(/set "REDION_HOLEN_ERFOLG=1"/g)];
  assert.ok(resetInPull >= 0, 'Holen setzt das alte Signal bei jedem Aufruf zurueck');
  assert.equal(choices.length, 3, 'Rote, laufende und unbekannte CI-Warnung muessen N als Abbruch behandeln');
  assert.equal(successes.length, 2, 'Erfolgssignal nur bei bereits synchron und nach Checkout');
  const alreadyCurrent = pull.indexOf('Dieser Ordner ist schon genau auf dem Stand von GitHub');
  const checkedOut = pull.indexOf('Der Ordner hat jetzt genau den Stand von GitHub');
  assert.ok(successes[0].index > alreadyCurrent &&
    successes[1].index > checkedOut,
    'Kein Erfolgssignal vor Zustimmung oder Abschluss der Aktualisierung');
});

test('Redion-Live prueft Node >=22.18 vor npm ci', () => {
  const version = live.indexOf('major===22&&minor>=18');
  const install = live.indexOf('call npm ci');
  assert.ok(version >= 0 && version < install,
    'Nicht kompatible Node-Versionen muessen vor dem Build scheitern');
  assert.match(live, /if errorlevel 1 \([\s\S]*?Node\.js ist zu alt/);
});

test('Windows-Prueflauf zeigt Protokollhinweise statt sie auszufuehren', () => {
  assert.match(check, /^echo\s+Das vollstaendige Pruefprotokoll liegt/m);
  assert.doesNotMatch(check, /^\s+Das vollstaendige Pruefprotokoll liegt/m);
  assert.match(check, /schaltplan-protokoll\.mjs --where/);
});

test('Holskript meldet bei privatem Repo Zugriffsprobleme statt oeffentlichen Zugriff zu behaupten', () => {
  assert.match(pull, /Redion ist ein PRIVATES Repository/);
  assert.match(pull, /Git Credential Manager/);
  assert.match(pull, /Keine Testfreigabe/i);
  assert.doesNotMatch(pull, /Das Verzeichnis ist oeffentlich lesbar/);
});

test('Privater PR fragt bei unbekanntem CI-Status nach Zustimmung', () => {
  const start = pull.indexOf('if "%LAUFSTATUS%"=="unbekannt" (');
  const end = pull.indexOf('if "%LAUFSTATUS%"=="keiner" (');
  assert.ok(start >= 0 && end > start, 'Unbekannt-Zweig muss eigenstaendig sein');
  const block = pull.slice(start, end);
  assert.match(block, /if \/I "%ZIEL%"=="ux\/windows-schaltplan-dock-20261108" \(/);
  assert.match(block, /choice \/c JN \/t 30 \/d N/);
  assert.match(block, /if errorlevel 2 goto ende/);
  assert.ok(block.indexOf('if errorlevel 2 goto ende') <
    block.lastIndexOf('goto lauf_geklaert'),
    'Abgelehntes CI darf nie zum erlaubten Holen durchfallen');
  assert.match(block, /Fuer normale Zweige einschliesslich main bleibt/);
});
