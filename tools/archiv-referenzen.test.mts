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
