/* The CJS branch exports the same generated solver that index.html loads.
 * No globals, dynamic code generation, or second electrical model. */
// @ts-expect-error Classic browser build has no module declaration.
import compiled from '../../quell/bereiche/elektro/simulation.js';

const simulation: typeof Stromfluss = compiled;
const record=(value:unknown):value is Record<string,unknown>=>
  !!value&&typeof value==='object'&&!Array.isArray(value);
const position=(value:unknown):value is number=>
  typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=100000;
const id=(value:unknown):value is string=>
  typeof value==='string'&&value.length>0&&value.length<=128&&!Object.hasOwn(Object.prototype,value);

function validatePlan(plan:Record<string,unknown>,rechnungen:number) {
  if(!Array.isArray(plan.teile)||!Array.isArray(plan.leitungen)||
      plan.teile.length>60||plan.leitungen.length>100)
    throw new Error('Für die Cloud-Prüfung einen Teilplan mit höchstens 60 Bauteilen und 100 Leitungen wählen.');
  const bauteile=new Map<string,string>();
  for(const teil of plan.teile){
    if(!record(teil)||!id(teil.id)||typeof teil.zeichen!=='string'||!position(teil.x)||
       !position(teil.y)||!record(teil.nummern)||
       (teil.bmk!==undefined&&typeof teil.bmk!=='string')||bauteile.has(teil.id))
      throw new Error('Der Plan enthält ein ungültiges Bauteil.');
    bauteile.set(teil.id,teil.zeichen);
  }
  let punkte=0;
  for(const leitung of plan.leitungen){
    if(!record(leitung)||!id(leitung.id)||!Array.isArray(leitung.punkte)||
       !leitung.punkte.every(punkt=>record(punkt)&&position(punkt.x)&&position(punkt.y)))
      throw new Error('Der Plan enthält eine ungültige Leitung.');
    punkte+=leitung.punkte.length;
  }
  if(punkte>500||rechnungen*(plan.teile.length+plan.leitungen.length)>2400||
      rechnungen*punkte>6400)
    throw new Error('Die Cloud-Prüfung überschreitet die Rechengrenze. Einen kleineren Teilplan oder weniger Schalter wählen.');
  if(record(plan.relaisLegacy)&&plan.relaisLegacy.verifiziert!==true)
    throw new Error('Die importierte Relaisverdrahtung muss im Editor freigegeben werden.');
  if(plan.batterieUebung)
    throw new Error('Batterieübungen werden im eigenen Batterielabor ausgewertet.');
  return bauteile;
}

const grenze='Statische Rechnung aus der Ruhelage. Keine elektrische Norm- oder Sicherheitsabnahme.';

export function runSwitchTest(plan:Record<string,unknown>,request:unknown) {
  if(!record(request)||Object.keys(request).some(key=>!['switchIds','targetId','expected'].includes(key)))
    throw new Error('Ungültiger Kombinationsauftrag.');
  const {switchIds,targetId,expected}=request;
  if(!Array.isArray(switchIds)||switchIds.length<1||switchIds.length>6||!switchIds.every(id)||
      !id(targetId)||!Array.isArray(expected)||expected.length<1||expected.length>32||
      !expected.every(value=>typeof value==='boolean'))
    throw new Error('Schalter, Zielbauteil und boolesche Sollfolge angeben.');

  validatePlan(plan,expected.length);
  const report=simulation.pruefeSchalter(plan,switchIds,targetId,expected);
  const faelle=report.faelle.map(({warnungen,anschlussfehler,annahmen,...fall})=>({
    ...fall,
    warnungen:warnungen.slice(0,4).map(hinweis=>hinweis.slice(0,300)),
    anschlussfehler:anschlussfehler.slice(0,4),
    annahmen:annahmen.slice(0,4).map(hinweis=>hinweis.slice(0,300)),
    hinweiseGekuerzt:warnungen.length>4||anschlussfehler.length>4||annahmen.length>4||
      [...warnungen,...annahmen].some(hinweis=>hinweis.length>300)
  }));
  return {...report,faelle,grenze};
}

export function measureOperatingPoint(plan:Record<string,unknown>,request:unknown) {
  if(!record(request)||Object.keys(request).some(key=>!['switches','componentIds'].includes(key)))
    throw new Error('Ungültiger Messauftrag.');
  const {switches,componentIds}=request;
  if(!Array.isArray(switches)||switches.length>12||!Array.isArray(componentIds)||
      !componentIds.length||componentIds.length>8||!componentIds.every(id)||
      new Set(componentIds).size!==componentIds.length)
    throw new Error('Bis zu zwölf Schalter und ein bis acht verschiedene Messobjekte angeben.');
  const bauteile=validatePlan(plan,1);
  if(componentIds.some(componentId=>!bauteile.has(componentId)))
    throw new Error('Ein Messobjekt fehlt im Plan.');
  const stellungen:Record<string,number>=Object.create(null);
  for(const eintrag of switches){
    if(!record(eintrag)||Object.keys(eintrag).some(key=>key!=='componentId'&&key!=='position')||
        !id(eintrag.componentId)||typeof eintrag.position!=='number'||
        !Number.isSafeInteger(eintrag.position)||eintrag.position<0||
        Object.hasOwn(stellungen,eintrag.componentId))
      throw new Error('Ungültige oder doppelte Schalterstellung.');
    const modell=simulation.verhalten(bauteile.get(eintrag.componentId)??'');
    if(modell?.folgtSpule||!modell?.stellungen?.[eintrag.position])
      throw new Error('Keine manuell einstellbare Stellung für '+eintrag.componentId+'.');
    stellungen[eintrag.componentId]=eintrag.position;
  }
  const nichtModelliert=[...bauteile].filter(([,symbol])=>!simulation.verhalten(symbol))
    .map(([id,symbol])=>({id,symbol}));
  if(nichtModelliert.length)return {status:'nicht_modelliert',nichtModelliert,grenze};
  const ergebnis=simulation.rechne(plan,stellungen);
  const status=!ergebnis.ok?'nicht_berechenbar':ergebnis.konvergiert?'berechnet':'instabil';
  const messwerte=status==='berechnet'?componentIds.map(componentId=>{
    const wert=ergebnis.werte[componentId]??null;
    const glieder=Object.values(ergebnis.teilwerte[componentId]??{});
    return {componentId,verfuegbar:!!wert||!!glieder.length,wert,glieder};
  }):[];
  return {status,grenze,messwerte,wechsel:ergebnis.wechsel,stellungen:ergebnis.stellungen,
    spulen:ergebnis.spulen,fehler:ergebnis.fehler,annahmen:ergebnis.annahmen,
    warnungen:ergebnis.warnungen.slice(0,20),hinweiseGekuerzt:ergebnis.warnungen.length>20};
}
