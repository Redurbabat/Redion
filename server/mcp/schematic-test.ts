/* The CJS branch exports the same generated solver that index.html loads.
 * No globals, dynamic code generation, or second electrical model. */
// @ts-expect-error Classic browser build has no module declaration.
import compiled from '../../quell/bereiche/elektro/simulation.js';

// @ts-expect-error Classic browser build has no module declaration.
import compiledPlan from '../../quell/bereiche/bloecke/arten/schaltplan.js';
import {BUILTIN_SYMBOLS} from './symbol-catalog.ts';

const simulation: typeof Stromfluss = compiled;
const planTools: typeof Schaltplan = compiledPlan;
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

// Report the actual component IDs, rather than only a generic solver
// assumption. Do not silently insert values or infer voltage from labels.
export function componentParameterHints(plan:Record<string,unknown>){
  type Hint={componentId:string;symbol:string;field:'U'|'R'|'Un';
    reason:'missing'|'invalid';modelDefault?:number};
  const hints:Hint[]=[];
  const lights=new Set(['lampe','signalleuchte','ch-kontrolllampe','ch-orientierungslampe','bp-leuchte']);
  for(const part of Array.isArray(plan.teile)?plan.teile:[]){
    if(!record(part)||!id(part.id)||typeof part.zeichen!=='string')continue;
    const model=simulation.verhalten(part.zeichen);
    if(!model)continue;
    const values=record(part.werte)?part.werte:{};
    const check=(field:Hint['field'],fallback:number,valid:(v:unknown)=>boolean)=>{
      const value=values[field];
      if(valid(value))return;
      const missing=!Object.hasOwn(values,field);
      hints.push({componentId:part.id as string,symbol:part.zeichen as string,field,
        reason:missing?'missing':'invalid',
        // For invalid explicit Un the native solver need not fall back;
        // do not claim a default was used in that case.
        ...(field!=='Un'||missing?{modelDefault:fallback}:{})});
    };
    const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v);
    const positive=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0;
    if(model.art==='quelle')check('U',typeof model.wert==='number'?model.wert:230,finite);
    if(model.art==='widerstand'){
      check('R',typeof model.wert==='number'&&model.wert>0?model.wert:1000,positive);
      if(lights.has(part.zeichen))check('Un',230,positive);
    }
  }
  return {parameterHinweise:hints.slice(0,40),parameterHinweiseGesamt:hints.length,
    parameterHinweiseGekuerzt:hints.length>40};
}

/** Read-only inspection of persisted geometry. A free wire end can be a
 * legitimate junction or rail, so absence of endpoint metadata alone is not
 * an error. This is not a connectivity or electrical safety certificate. */
export function auditWiring(plan:Record<string,unknown>){
  validatePlan(plan,1);
  const width=plan.breite,height=plan.hoehe;
  if(typeof width!=='number'||!Number.isFinite(width)||width<=0||
    typeof height!=='number'||!Number.isFinite(height)||height<=0)
    throw new Error('Ungültige Planabmessungen.');
  type Issue={code:string;severity:'error'|'hint';elementId:string;
    end?:'from'|'to';componentId?:string;terminal?:string;
    expected?:{x:number;y:number};actual?:{x:number;y:number}};
  const issues:Issue[]=[];
  const native=plan as unknown as Parameters<typeof Schaltplan.kontakte>[0];
  const parts=new Map(native.teile.map(p=>[p.id,p]));
  const badParts=new Set<string>();
  for(const part of native.teile){
    if(!BUILTIN_SYMBOLS.some(s=>s.id===part.zeichen)){
      issues.push({code:'symbol_not_in_cloud_catalog',severity:'hint',elementId:part.id});
      badParts.add(part.id);
    }else if((part.drehung!==undefined&&![0,90,180,270].includes(part.drehung))||
      (part.gespiegelt!==undefined&&typeof part.gespiegelt!=='boolean')){
      issues.push({code:'invalid_transform',severity:'error',elementId:part.id});
      badParts.add(part.id);
    }
  }
  const seen=new Set(parts.keys());
  const usable:typeof native.leitungen=[];
  const outside=(p:{x:number;y:number})=>p.x<0||p.x>width||p.y<0||p.y>height;
  for(const wire of native.leitungen){
    if(seen.has(wire.id))issues.push({code:'duplicate_element_id',severity:'error',elementId:wire.id});
    seen.add(wire.id);
    const pts=wire.punkte;
    if(pts.length<2){
      issues.push({code:'wire_too_short',severity:'error',elementId:wire.id});
      continue;
    }
    usable.push(wire);
    if(pts.some(outside))issues.push({code:'wire_outside_sheet',severity:'error',elementId:wire.id});
    if(pts.some((p,i)=>i>0&&p.x===pts[i-1]!.x&&p.y===pts[i-1]!.y))
      issues.push({code:'duplicate_wire_point',severity:'hint',elementId:wire.id});
    if(pts.some((p,i)=>i>0&&p.x!==pts[i-1]!.x&&p.y!==pts[i-1]!.y))
      issues.push({code:'diagonal_segment',severity:'hint',elementId:wire.id});
    const ends=[['from',wire.vonTeil,wire.vonNr,pts[0]!],
      ['to',wire.nachTeil,wire.nachNr,pts[pts.length-1]!]] as const;
    for(const [end,partId,nr,actual] of ends){
      if(partId===undefined&&nr===undefined)continue;
      const base={elementId:wire.id,end,actual:{x:actual.x,y:actual.y}};
      if(typeof partId!=='string'||!partId||typeof nr!=='string'||!nr){
        issues.push({...base,code:'incomplete_terminal_binding',severity:'error'});
        continue;
      }
      const part=parts.get(partId);
      const ref={...base,componentId:partId,terminal:nr};
      if(!part){
        issues.push({...ref,code:'missing_component',severity:'error'});
        continue;
      }
      if(badParts.has(partId))continue;
      const resolved=planTools.klemmeFuer(part,nr,actual);
      const expected=resolved?planTools.anschlussOrt(part,resolved):null;
      if(!expected){
        issues.push({...ref,code:'unknown_terminal',severity:'error'});
        continue;
      }
      if(resolved!==nr)issues.push({...ref,code:'legacy_terminal_alias',severity:'hint'});
      if(actual.x!==expected.x||actual.y!==expected.y)
        issues.push({...ref,code:'terminal_position_mismatch',severity:'error',expected});
    }
  }
  // Native overlap test distinguishes an overlap from a perpendicular crossing.
  for(const wire of usable)
    if(planTools.ueberlappt(wire.punkte,usable,wire.id))
      issues.push({code:'overlapping_wire',severity:'hint',elementId:wire.id});
  const errors=issues.filter(i=>i.severity==='error').length;
  return {status:errors?'geometry_errors':issues.length?'geometry_hints':'no_geometry_issues_found',
    componentCount:native.teile.length,wireCount:native.leitungen.length,
    errorCount:errors,hintCount:issues.length-errors,issues:issues.slice(0,40),
    truncated:issues.length>40,...componentParameterHints(plan),
    grenze:'Geometrische Teilprüfung; keine vollständige Netz-, Norm- oder Sicherheitsabnahme.'};
}

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
  return {...report,faelle,grenze,...componentParameterHints(plan)};
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
  if(nichtModelliert.length)return {status:'nicht_modelliert',nichtModelliert,grenze,...componentParameterHints(plan)};
  const ergebnis=simulation.rechne(plan,stellungen);
  const status=!ergebnis.ok?'nicht_berechenbar':ergebnis.konvergiert?'berechnet':'instabil';
  const messwerte=status==='berechnet'?componentIds.map(componentId=>{
    const wert=ergebnis.werte[componentId]??null;
    const glieder=Object.values(ergebnis.teilwerte[componentId]??{});
    return {componentId,verfuegbar:!!wert||!!glieder.length,wert,glieder};
  }):[];
  return {status,grenze,messwerte,wechsel:ergebnis.wechsel,stellungen:ergebnis.stellungen,
    spulen:ergebnis.spulen,fehler:ergebnis.fehler,annahmen:ergebnis.annahmen,
    anschlussfehler:ergebnis.anschlussfehler.slice(0,20),
    warnungen:ergebnis.warnungen.slice(0,20),
    hinweiseGekuerzt:ergebnis.warnungen.length>20||ergebnis.anschlussfehler.length>20,
    ...componentParameterHints(plan)};
}
