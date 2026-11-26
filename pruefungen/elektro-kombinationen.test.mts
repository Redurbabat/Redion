import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const runtime = createContext({ crypto });
runtime.window = runtime;
for (const file of [
  'register/fachzeichen.js',
  'bereiche/bloecke/arten/schaltplan.js',
  'bereiche/elektro/simulation.js',
]) {
  runInContext(readFileSync(new URL('../quell/' + file, import.meta.url), 'utf8'), runtime, { filename: file });
}

test('Schema 6 berechnet alle acht Sollzustände und erkennt einen fehlenden Rückleiter', () => {
  const plan = runtime.Schaltplan.neuerPlan('stromlauf-aufgeloest');
  plan.teile = [
    ['G1', 'wechselspannung'], ['S1', 'ch-schema3'], ['S2', 'ch-schema6'],
    ['S3', 'ch-schema3'], ['E1', 'lampe'],
  ].map(([id, zeichen], i) => ({
    id, zeichen, x: 40 + 100 * i, y: 40, drehung: 0, gespiegelt: false,
    bmk: id, nummern: {}, gruppe: '', ebene: 'plan'
  }));
  plan.leitungen = [
    ['G1','L','S1','3'], ['S1','1','S2','1'], ['S1','2','S2','3'],
    ['S2','2','S3','1'], ['S2','4','S3','2'], ['S3','3','E1','X1'], ['E1','X2','G1','N'],
  ].map(([vonTeil, vonNr, nachTeil, nachNr], i) => ({
    id: 'W' + i, vonTeil, vonNr, nachTeil, nachNr, ebene: 'plan', punkte: []
  }));
  const soll = [true, false, false, true, false, true, true, false];
  const schalter = ['S1', 'S2', 'S3'];
  const before = JSON.stringify(plan);
  const report = runtime.Stromfluss.pruefeSchalter(plan, schalter, 'E1', soll);
  assert.equal(report.status, 'bestanden', JSON.stringify(report.faelle));
  assert.deepEqual(Array.from(report.faelle, (fall: {ist: boolean}) => fall.ist), soll);
  assert.equal(JSON.stringify(plan), before);
  assert.equal(JSON.stringify(runtime.Stromfluss.pruefeSchalter(plan, schalter, 'E1', soll)), JSON.stringify(report));

  const offen = { ...plan, leitungen: plan.leitungen.slice(0, -1) };
  const broken = runtime.Stromfluss.pruefeSchalter(offen, schalter, 'E1', soll);
  assert.equal(broken.status, 'fehlgeschlagen');
  assert.equal(broken.faelle.filter((fall: {bestanden: boolean}) => !fall.bestanden).length, 4);

  const unbekannt = { ...plan, teile: [...plan.teile, { id: 'X', zeichen: 'ohne-modell' }] };
  assert.equal(runtime.Stromfluss.pruefeSchalter(unbekannt, schalter, 'E1', soll).status, 'nicht_modelliert');
  assert.throws(() => runtime.Stromfluss.pruefeSchalter(plan, schalter, 'E1', [true]), /Sollwert/);
});
