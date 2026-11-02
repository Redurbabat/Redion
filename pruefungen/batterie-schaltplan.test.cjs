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
  test('Kapitel-12-Aufgabe '+a.id+' mit echten Redion-Netzen',()=>{
    const plan=BatterieAufgaben.planFuer(a.id);
    assert.equal(plan.teile.filter(t=>t.zeichen==='batterie').length,a.anfang||a.zellen.length);
    assert.equal(plan.teile.filter(t=>t.zeichen==='klemme').length,a.ausgaenge?5:2);
    assert.equal(plan.leitungen.length,0);
    BatterieAufgaben.musterFuer(plan);
    assert.equal(plan.batterieUebung.teile.length,a.zellen.length);
    const ziele=a.ausgaenge||[a];
    ziele.forEach((ziel,i)=>{
      const r=BatterieKern.ausPlan(plan,Stromfluss.netze(plan),i);
      assert.equal(r.ok,true,'Falsches Netz für '+a.id+' Ausgang '+i+': '+(r.grund||''));
      if(ziel.zielU!==undefined)assert.ok(Math.abs(r.u-ziel.zielU)<1e-6);
      if(ziel.zielI!==undefined)assert.ok(r.maxA+1e-6>=ziel.zielI);
      if(a.zellen.every(x=>x.ri===null))assert.equal(r.ri,null);
      if(a.zellen.every(x=>x.q===null))assert.equal(r.ah,null);
    });
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

test('Vier Batterieabgänge und 36 Zellen werden nach dem Laden erhalten',()=>{
  const plan=BatterieAufgaben.planFuer('taps');
  BatterieAufgaben.musterFuer(plan);
  const geladen=Schaltplan.lesen({plan});
  assert.equal(geladen.batterieUebung.teile.length,36);
  assert.equal(geladen.batterieUebung.ausgaenge.length,4);
  geladen.batterieUebung.ausgaenge.forEach((ziel,i)=>{
    const r=BatterieKern.ausPlan(geladen,Stromfluss.netze(geladen),i);
    assert.equal(r.ok,true,r.grund||'');
    assert.ok(Math.abs(r.u-ziel.zielU)<1e-7);
  });
});
