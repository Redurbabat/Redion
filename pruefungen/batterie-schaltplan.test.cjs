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

/* Echte frei gezeichnete Bauteile müssen ohne Arbeitsblatt-Vorlage messbar
 * sein; der Windows-Stromknopf verwendet genau diese Netzliste. */
test('Leeres Batterieblatt: frei eingesetzte Zelle wird in U, Ri, A und Q gemessen',()=>{
  const plan=BatterieAufgaben.planFuer('selbst');
  assert.equal(plan.batterieUebung.teile.length,0);
  const zelle={id:Schaltplan.uid(),zeichen:'batterie',bmk:'G1',x:200,y:220,
    drehung:0,gespiegelt:false,nummern:{},gruppe:'',ebene:'plan',
    werte:{U:1.5,Ri:.3,Imax:1,Q:.5}};
  plan.teile.push(zelle);
  const plus=plan.teile.find(t=>t.id===plan.batterieUebung.plus);
  const minus=plan.teile.find(t=>t.id===plan.batterieUebung.minus);
  const draht=(a,an,b,bn)=>{
    const s=Schaltplan.anschlussOrt(a,an),e=Schaltplan.anschlussOrt(b,bn);
    const punkte=Schaltplan.leitungFuehren(plan,s,e,
      {teil:a.id,nr:an},{teil:b.id,nr:bn});
    plan.leitungen.push({id:Schaltplan.uid(),punkte,
      ebene:'plan',vonTeil:a.id,vonNr:an,nachTeil:b.id,nachNr:bn});
  };
  draht(zelle,'+',plus,'1');draht(zelle,'−',minus,'1');
  const r=BatterieKern.ausPlan(plan,Stromfluss.netze(plan));
  assert.equal(r.ok,true,r.grund);
  assert.equal(r.u,1.5);
  assert.ok(Math.abs(r.ri-.3)<1e-7);
  assert.ok(Math.abs(r.maxA-1)<1e-7);
  assert.ok(Math.abs(r.ah-.5)<1e-7);

  const resistor={id:Schaltplan.uid(),zeichen:'widerstand',bmk:'R1',
    x:400,y:400,drehung:0,gespiegelt:false,nummern:{},gruppe:'',ebene:'plan',
    werte:{R:3}};
  plan.teile.push(resistor);
  draht(resistor,'1',plus,'2');draht(resistor,'2',minus,'2');
  const last=BatterieKern.lastAusPlan(plan,Stromfluss.netze(plan));
  assert.equal(last.ok,true,last.grund);
  assert.ok(Math.abs(last.ohm-3)<1e-7);
  assert.ok(Math.abs(r.u/(last.ohm+r.ri)-(1.5/3.3))<1e-7);
});

test('Widerstandsersatzwert: mehrere parallele gezeichnete Verbraucher',()=>{
  const plan=BatterieAufgaben.planFuer('selbst');
  const plus=plan.teile.find(t=>t.id===plan.batterieUebung.plus);
  const minus=plan.teile.find(t=>t.id===plan.batterieUebung.minus);
  // Klemmen 1/2 gelten jeweils als derselbe Ausgang. Resistornetze können
  // dabei je eine andere Anschlussseite verwenden.
  for(let i=0;i<2;i++){
    const t={id:Schaltplan.uid(),zeichen:'widerstand',bmk:'R'+i,
      x:160+i*150,y:300,drehung:0,gespiegelt:false,nummern:{},
      gruppe:'',ebene:'plan',werte:{R:4}};
    plan.teile.push(t);
    for(const [nr,k] of [['1',plus],['2',minus]]){
      const a=Schaltplan.anschlussOrt(t,nr),b=Schaltplan.anschlussOrt(k,'2');
      const punkte=Schaltplan.leitungFuehren(plan,a,b,{teil:t.id,nr},{teil:k.id,nr:'2'});
      plan.leitungen.push({id:Schaltplan.uid(),punkte,ebene:'plan',
        vonTeil:t.id,vonNr:nr,nachTeil:k.id,nachNr:'2'});
    }
  }
  const result=BatterieKern.lastAusPlan(plan,Stromfluss.netze(plan));
  assert.equal(result.ok,true,result.grund);
  assert.ok(Math.abs(result.ohm-2)<1e-7,result.ohm);
});
