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


test('Schulaufgabe setzt 6 editierbare Zellen und zwei echte Klemmen in den Redion-Plan', () => {
  let nummer=0;
  const original=global.Schaltplan;
  global.Schaltplan={
    uid:()=> 'test' + (++nummer),
    neuerPlan:art=>({art,breite:800,hoehe:700,teile:[],leitungen:[],texte:[],
      ebenen:[{id:'plan',name:'Plan',farbe:'black',sichtbar:true}]})
  };
  try {
    const {planFuer}=require('../batterie-aufgaben.js');
    const plan=planFuer('k9');
    assert.equal(plan.teile.filter(x=>x.zeichen==='batterie').length,6);
    assert.equal(plan.teile.filter(x=>x.zeichen==='klemme').length,2);
    assert.equal(plan.batterieUebung.teile.length,6);
    assert.deepEqual(plan.teile.filter(x=>x.zeichen==='batterie').map(x=>x.werte.U),
      [1.5,1.5,1.5,1.5,1.5,1.5]);
    assert.equal(plan.leitungen.length,0);
  } finally {global.Schaltplan=original;}
});
test('Redion-Netznummern: parallel verdrahtete Zellen werden an Klemme 2 erkannt', () => {
  const teile=Array.from({length:6}, (_,i)=>({
    id:'B'+i, zeichen:'batterie', bmk:'G'+(i+1),
    werte:{U:1.5,Ri:.3,Imax:1,Q:.5}
  }));
  const plan={
    teile:[...teile,{id:'Xplus',zeichen:'klemme'},{id:'Xminus',zeichen:'klemme'}],
    batterieUebung:{id:'k45',teile:teile.map(t=>t.id),plus:'Xplus',minus:'Xminus'}
  };
  const verbindungen=b.reiheParallel(6,3);
  const alle=['aus+','aus-',...Array.from({length:6},(_,i)=>['n'+i,'p'+i]).flat()];
  const vater=new Map(alle.map(x=>[x,x]));
  const finde=x=>{let v=x;while(vater.get(v)!==v)v=vater.get(v);return v;};
  verbindungen.forEach(([a,c])=>vater.set(finde(a),finde(c)));
  const nummern=new Map();
  const nr=x=>{const r= finde(x);if(!nummern.has(r))nummern.set(r,nummern.size);return nummern.get(r);};
  const netzVon=new Map();
  teile.forEach((t,i)=>{
    netzVon.set('k:'+t.id+':−',nr('n'+i));
    netzVon.set('k:'+t.id+':+',nr('p'+i));
  });
  // Die Übung kann an der unteren statt oberen Klemmen-Seite verdrahtet sein.
  netzVon.set('k:Xplus:1',1000);
  netzVon.set('k:Xplus:2',nr('aus+'));
  netzVon.set('k:Xminus:1',1001);
  netzVon.set('k:Xminus:2',nr('aus-'));
  const r=b.ausPlan(plan,{netzVon});
  assert.equal(r.ok,true);
  fast(r.u,4.5);fast(r.ri,.45);fast(r.maxA,2);fast(r.ah,1);
});
