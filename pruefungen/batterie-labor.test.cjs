/* Batterieanlagen: deterministische Proben ohne Browser.
 * Ausführen: node --test pruefungen/batterie-labor.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const b = require('../batterie-labor-kern.js');

const zellen = (anzahl, daten = {}) => Array.from({length:anzahl},
  () => ({u:1.5,ri:.3,maxA:1,ah:.5,...daten}));
const fast = (ist, soll) => assert.ok(Math.abs(ist-soll)<1e-7, ist + ' != ' + soll);

test('6 Leclanché-Zellen in Reihe: 9 V, 1,8 Ω, 1 A, 500 mAh', () => {
  const r=b.pruefen(zellen(6),b.reiheParallel(6,6));
  assert.equal(r.ok,true); fast(r.u,9); fast(r.ri,1.8); fast(r.maxA,1); fast(r.ah,.5);
});
test('6 Leclanché-Zellen parallel: 1,5 V, 0,05 Ω, 6 A, 3 Ah', () => {
  const r=b.pruefen(zellen(6),b.reiheParallel(6,1));
  assert.equal(r.ok,true); fast(r.u,1.5); fast(r.ri,.05); fast(r.maxA,6); fast(r.ah,3);
});
test('3er-Reihen zweifach parallel: 4,5 V, 0,45 Ω, 2 A, 1 Ah', () => {
  const r=b.pruefen(zellen(6),b.reiheParallel(6,3));
  assert.equal(r.ok,true); fast(r.u,4.5); fast(r.ri,.45); fast(r.maxA,2); fast(r.ah,1);
});
test('2er-Reihen dreifach parallel: 3 V, 0,2 Ω, 3 A, 1,5 Ah', () => {
  const r=b.pruefen(zellen(6),b.reiheParallel(6,2));
  assert.equal(r.ok,true); fast(r.u,3); fast(r.ri,.2); fast(r.maxA,3); fast(r.ah,1.5);
});
test('Blatt 57: 6 Bleiakkuzellen, 3 in Reihe und 2 parallel', () => {
  const r=b.pruefen(zellen(6,{u:2,ri:.05,maxA:12,ah:72}),b.reiheParallel(6,3));
  assert.equal(r.ok,true); fast(r.u,6); fast(r.ri,.075); fast(r.maxA,24); fast(r.ah,144);
});
test('12 Zellen: 3 in Reihe und 4 Zweige liefern 12 A; unbekanntes Q und Ri bleibt unbekannt', () => {
  const r=b.pruefen(zellen(12,{u:2,ri:null,ah:null,maxA:3}),b.reiheParallel(12,3));
  assert.equal(r.ok,true); fast(r.maxA,12);
  assert.equal(r.ri,null); assert.equal(r.ah,null);
});
test('Vertauschte Ausgangspolarität wird nicht als gültige Lösung angenommen', () => {
  const l=b.reiheParallel(6,6).map(p=>p.map(id=>id==='aus+'?'aus-':id==='aus-'?'aus+':id));
  const r=b.pruefen(zellen(6),l);
  assert.equal(r.ok,false);
  assert.match(r.grund,/Polarität/);
});
test('Kurzschluss der Ausgangsadern wird erkannt', () => {
  const r=b.pruefen(zellen(6),[...b.reiheParallel(6,6),['aus+','aus-']]);
  assert.equal(r.ok,false);
  assert.match(r.grund,/Kurzschluss/);
});
test('Offener Nebenast zählt nicht als vollständige Batterieanlage', () => {
  const r=b.pruefen(zellen(3),[
    ['aus-','n0'],['p0','n1'],['p1','aus+'],['p1','n2']]);
  assert.equal(r.ok,false);
  assert.match(r.grund,/offenen Nebenast/);
});
test('Verschiedene Zellspannungen werden statt falscher Rechnung abgelehnt', () => {
  const s=zellen(2);s[1].u=2;
  const r=b.pruefen(s,b.reiheParallel(2,2));
  assert.equal(r.ok,false);
  assert.match(r.grund,/unterschiedliche/);
});
