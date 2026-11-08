import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pruefeArchivreferenzen } from './archiv-referenzen.mts';

async function mitProjekt<T>(fn: (wurzel: string) => Promise<T>): Promise<T> {
  const wurzel = await mkdtemp(path.join(tmpdir(), 'redion-archiv-pruefung-'));
  try { return await fn(wurzel); }
  finally { await rm(wurzel, { recursive: true, force: true }); }
}
async function datei(wurzel: string, name: string, text: string): Promise<void> {
  const pfad = path.join(wurzel, name);
  await mkdir(path.dirname(pfad), { recursive: true });
  await writeFile(pfad, text, 'utf8');
}

test('ohne Archiv ist der Pruefer ein lesender No-op', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'README.md', '[Alt](doku/ALT.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.archivDateien.length, 0);
  assert.equal(ergebnis.kaputteLinks.length, 0);
}));

test('nach dem Umzug meldet er kaputten relativen Markdown-Link', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alte Notiz');
  await datei(wurzel, 'doku/PLAN.md', 'Verweis: [alt](ALT.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 1);
  assert.equal(ergebnis.kaputteLinks[0]?.datei, 'doku/PLAN.md');
  assert.equal(ergebnis.kaputteLinks[0]?.archiviertUnter, 'doku/mehr nicht nutzbar/ALT.md');
}));

test('aktualisierter relativer Link auf das Archiv ist gueltig', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alt');
  await datei(wurzel, 'doku/PLAN.md', '[alt](mehr%20nicht%20nutzbar/ALT.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 0);
  assert.equal(ergebnis.erwaehnungen.length, 1);
}));

test('blosse Texterwaehnung wird nicht als kaputter Link fehlklassifiziert', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alt');
  await datei(wurzel, 'doku/PLAN.md', 'Im Jahr 2025 gab es doku/ALT.md.');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 0);
  assert.equal(ergebnis.erwaehnungen.length, 1);
}));

test('externe Links werden ignoriert und Archivprotokolle nicht mitgescannt', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alt');
  await datei(wurzel, 'doku/mehr nicht nutzbar/README.md', '[alter Pfad](../ALT.md)');
  await datei(wurzel, 'doku/PLAN.md', '[extern](https://example.org/doku/ALT.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 0);
  assert.equal(ergebnis.erwaehnungen.length, 1);
}));

test('Dateien bleiben nach Pruefung bytegleich', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alte Notiz\n');
  await datei(wurzel, 'doku/PLAN.md', '[ALT](ALT.md)\n');
  const vorher = await readFile(path.join(wurzel, 'doku/PLAN.md'));
  await pruefeArchivreferenzen(wurzel);
  assert.deepEqual(await readFile(path.join(wurzel, 'doku/PLAN.md')), vorher);
}));

test('Verschobene Originaldatei meldet eigenen durch Umzug defekten Link', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/NACHBAR.md', '# Nachbar');
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '[nachbar](NACHBAR.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.verschobeneQuellLinks.length, 1);
  assert.deepEqual(ergebnis.verschobeneQuellLinks[0], {
    datei: 'doku/mehr nicht nutzbar/ALT.md', zeile: 1,
    ziel: 'NACHBAR.md', vorherZiel: 'doku/NACHBAR.md',
  });
}));

test('Angepasster Link im archivierten Original bleibt gueltig', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/NACHBAR.md', '# Nachbar');
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '[nachbar](../NACHBAR.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.verschobeneQuellLinks.length, 0);
}));

test('Alte Originaldateien im gemeinsamen Archiv bleiben untereinander verlinkt', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '[nachbar](ANDERE.md)');
  await datei(wurzel, 'doku/mehr nicht nutzbar/ANDERE.md', '# andere');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 0);
  assert.equal(ergebnis.verschobeneQuellLinks.length, 0);
}));

test('Schon vor der Verschiebung ungueltige Links melden keinen neuen Fehler', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '[fehlend](GAB-ES-NIE.md)');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.verschobeneQuellLinks.length, 0);
}));


test('Referenzstil in aktiver Dokumentation erkennt alten Archivpfad', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alt');
  await datei(wurzel, 'doku/PLAN.md', '[historie][archiv]\n\n[archiv]: ALT.md "Alte Fassung"\n');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 1);
  assert.equal(ergebnis.kaputteLinks[0]?.zeile, 3);
  assert.equal(ergebnis.kaputteLinks[0]?.archiviertUnter, 'doku/mehr nicht nutzbar/ALT.md');
}));

test('Referenzstil in archiviertem Original erkennt durch Umzug kaputten Link', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/NACHBAR.md', '# Nachbar');
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '[details][bezug]\n\n[bezug]: <NACHBAR.md>\n');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.verschobeneQuellLinks.length, 1);
  assert.equal(ergebnis.verschobeneQuellLinks[0]?.zeile, 3);
  assert.equal(ergebnis.verschobeneQuellLinks[0]?.vorherZiel, 'doku/NACHBAR.md');
}));

test('Gueltiger kollabierter Referenzlink wird nicht beanstandet', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/NACHBAR.md', '# Nachbar');
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '[ziel][]\n\n[ziel]: ../NACHBAR.md\n');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.verschobeneQuellLinks.length, 0);
}));

test('Unbenutzte Referenzdefinition und Codeblock sind keine aktiven Links', () => mitProjekt(async wurzel => {
  await datei(wurzel, 'doku/mehr nicht nutzbar/ALT.md', '# Alt');
  await datei(wurzel, 'doku/PLAN.md', '```md\n[falsch][r]\n[r]: ALT.md\n[falsch](ALT.md)\n```\n\n[ungenutzt]: ALT.md\n');
  const ergebnis = await pruefeArchivreferenzen(wurzel);
  assert.equal(ergebnis.kaputteLinks.length, 0);
}));
