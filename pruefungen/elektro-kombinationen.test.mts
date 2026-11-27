import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';
import { runSwitchTest } from '../server/mcp/schematic-test.ts';
import { schema6 } from './hilfe/elektro-szenario.mts';

const runtime = createContext({ crypto });
runtime.window = runtime;
for (const file of [
  'register/fachzeichen.js',
  'bereiche/elektro/simulation.js',
  'bereiche/bloecke/arten/schaltplan.js',
]) {
  runInContext(readFileSync(new URL('../quell/' + file, import.meta.url), 'utf8'), runtime, { filename: file });
}

test('Schema 6 berechnet alle acht Sollzustände und erkennt einen fehlenden Rückleiter', () => {
  const {plan,soll,schalter} = schema6();
  const remote = runSwitchTest(plan, {switchIds:schalter,targetId:'E1',expected:soll});
  assert.equal(remote.status,'bestanden');
  assert.deepEqual(remote.faelle.map(fall=>fall.ist),soll);
  assert.throws(()=>runSwitchTest(plan,{switchIds:schalter,targetId:'E1',expected:soll,extra:1}),/Kombinationsauftrag/);
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

  const unbekannt = { ...plan, teile: [...plan.teile, { ...plan.teile[0], id: 'X', zeichen: 'ohne-modell' }] };
  assert.equal(runtime.Stromfluss.pruefeSchalter(unbekannt, schalter, 'E1', soll).status, 'nicht_modelliert');
  assert.throws(() => runtime.Stromfluss.pruefeSchalter(plan, schalter, 'E1', [true]), /Sollwert/);
});
