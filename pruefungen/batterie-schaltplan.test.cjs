/* Echte Plan-Integration, kein selbst erfundenes Netzmodell.
 * node --test pruefungen/batterie-schaltplan.test.cjs
 * Lädt dieselben Browser-JS-Dateien in einer isolierten VM ohne DOM. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const WURZEL=path.resolve(__dirname,'..');
const context={Register:{},performance:{now:()=>1}};
let z=0;
context.Ids={short:()=>String(++z)};
context.window=context;
const vmContext=vm.createContext(context);
for(const datei of [
  'quell/register/fachzeichen.js',
  'quell/bereiche/bloecke/arten/schaltplan.js',
  'quell/bereiche/elektro/simulation.js',
  'batterie-labor-kern.js',
  'batterie-aufgaben.js'
]) vm.runInContext(fs.readFileSync(path.join(WURZEL,datei),'utf8'),
  vmContext,{filename:datei,timeout:3000});

const {Schaltplan,Stromfluss,BatterieKern,BatterieAufgaben}=context;

for(const a of BatterieAufgaben.aufgaben) {
  test('Batterieplan '+a.id+' als echte Redion-Netze richtig berechnen',()=>{
    const plan=BatterieAufgaben.planFuer(a.id);
    assert.equal(plan.teile.filter(t=>t.zeichen==='batterie').length,a.zahl);
    assert.equal(plan.teile.filter(t=>t.zeichen==='klemme').length,2);
    assert.equal(plan.leitungen.length,0);
    BatterieAufgaben.musterFuer(plan);
    const r=BatterieKern.ausPlan(plan,Stromfluss.netze(plan));
    assert.equal(r.ok,true, 'Falsches Netz: '+(r.grund||''));
    if(a.zielU!==undefined)assert.ok(Math.abs(r.u-a.zielU)<1e-6);
    if(a.zielI!==undefined)assert.ok(r.maxA+1e-6>=a.zielI);
    if(a.ri===null)assert.equal(r.ri,null);
    if(a.q===null)assert.equal(r.ah,null);
  });
}

test('Planwerte und Aufgabenkennung über Schaltplan.lesen erhalten',()=>{
  const plan=BatterieAufgaben.planFuer('u6');
  const id=plan.batterieUebung.teile[0];
  const s=Schaltplan.lesen({plan});
  assert.equal(s.batterieUebung.teile[0],id);
  const t=s.teile.find(x=>x.id===id);
  assert.equal(t.werte.U,2);
  assert.equal(t.werte.Ri,.05);
  assert.equal(t.werte.Imax,12);
  assert.equal(t.werte.Q,72);
});
test('Löschen eines Zellenblocks darf keine fiktive korrekte Anlage ergeben',()=>{
  const plan=BatterieAufgaben.planFuer('k9');
  BatterieAufgaben.musterFuer(plan);
  const verloren=plan.batterieUebung.teile[0];
  plan.teile=plan.teile.filter(t=>t.id!==verloren);
  const r=BatterieKern.ausPlan(plan,Stromfluss.netze(plan));
  assert.equal(r.ok,false);
  assert.match(r.grund,/entfernt oder ersetzt/);
});
