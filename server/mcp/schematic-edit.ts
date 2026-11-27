/** Strict, versioned edits to RED ION's persisted block.plan format.
 * Client geometry is limited to the canonical 10px grid and BUILTIN_SYMBOLS.
 * This is an editor helper, NOT an electrical safety or standards verifier.
 */
import {BUILTIN_SYMBOLS} from './symbol-catalog.ts';
// @ts-expect-error Classic browser build has no module declaration.
import compiledPlan from '../../quell/bereiche/bloecke/arten/schaltplan.js';

const planTools:typeof Schaltplan=compiledPlan;

type Item=Record<string,unknown>;
type Pos={x:number;y:number};
const isRecord=(v:unknown):v is Item=>!!v&&typeof v==='object'&&!Array.isArray(v);
const ID=/^[A-Za-z0-9_-]{1,64}$/;
const LAYERS=['plan','aufgabe','loesung'] as const;

function fail(message:string):never {throw new Error(message);}
const ident=(v:unknown,what:string):string=>
  typeof v==='string'&&ID.test(v)?v:fail(what+' hat keine gültige Kennung.');
const nonempty=(v:unknown,what:string,max:number):string=>
  typeof v==='string'&&v.trim()&&v.length<=max?v.trim():fail(what+' fehlt oder ist zu lang.');
const layer=(v:unknown):string=>v===undefined?'plan':
  typeof v==='string'&&LAYERS.some(x=>x===v)?v:fail('Unbekannte Ebene.');
const grid=(v:unknown,what:string,max:number):number=>
  typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max&&v%10===0?
    v:fail(what+' muss im 10er-Raster und innerhalb des Plans liegen.');
const rotation=(v:unknown):number=>v===undefined?0:
  typeof v==='number'&&[0,90,180,270].includes(v)?v:fail('Drehung muss 0, 90, 180 oder 270 Grad sein.');
const mirror=(v:unknown):boolean=>v===undefined?false:
  typeof v==='boolean'?v:fail('Spiegelung muss true oder false sein.');
const allowedKeys=(a:Item,extra:string[])=>{
  const allowed=new Set(['workspaceId','blockId','expectedVersion','operation',...extra]);
  if(Object.keys(a).some(k=>!allowed.has(k)))fail('Nicht erlaubtes Feld für diese Bearbeitungsart.');
};
const terminalPos=(part:Item,terminal:string):Pos=>{
  const symbol=BUILTIN_SYMBOLS.find(z=>z.id===part.zeichen);
  if(!symbol)fail('Unbekanntes oder externes Fachzeichen im Schaltplan.');
  const pin=symbol.anschluesse.find(p=>p.nr===terminal);
  if(!pin)fail('Anschluss '+terminal+' existiert am Fachzeichen nicht.');
  const mirrored=part.gespiegelt===true;
  const relativeX=mirrored?symbol.w-pin.x:pin.x;
  const angle=Number(part.drehung||0)*Math.PI/180;
  const dx=relativeX-symbol.w/2,dy=pin.y-symbol.h/2;
  return {x:Number(part.x)+Math.round(symbol.w/2+dx*Math.cos(angle)-dy*Math.sin(angle)),
    y:Number(part.y)+Math.round(symbol.h/2+dx*Math.sin(angle)+dy*Math.cos(angle))};
};

/** Nearness rule matches the six-pixel terminal capture used by the
 * native editor. This deliberately rejects ambiguous contacts rather
 * than claiming full circuit/network validation. */
const NEAR=6;
const distSquared=(p:Pos,a:Pos,b:Pos):number=>{
  const dx=b.x-a.x,dy=b.y-a.y;
  const len=dx*dx+dy*dy;
  if(len===0)return (p.x-a.x)**2+(p.y-a.y)**2;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len));
  return (p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2;
};
const nearPath=(p:Pos,points:Pos[]):boolean=>{
  for(let i=0;i+1<points.length;i++){
    if(distSquared(p,points[i]!,points[i+1]!)<=NEAR**2)return true;
  }
  return false;
};
const validPoints=(data:unknown):Pos[]=>{
  if(!Array.isArray(data)||data.length<2||data.length>60||
    !data.every(p=>isRecord(p)&&typeof p.x==='number'&&Number.isFinite(p.x)&&
      typeof p.y==='number'&&Number.isFinite(p.y)))
    fail('Vorhandene Leitung hat ungültige Koordinaten.');
  return data as Pos[];
};
const orientation=(a:Pos,b:Pos,c:Pos)=>Math.sign((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
const nearSegments=(a:Pos,b:Pos,c:Pos,d:Pos):boolean=>{
  if(distSquared(a,c,d)<=NEAR**2||distSquared(b,c,d)<=NEAR**2||
    distSquared(c,a,b)<=NEAR**2||distSquared(d,a,b)<=NEAR**2)return true;
  return orientation(a,b,c)!==orientation(a,b,d)&&
    orientation(c,d,a)!==orientation(c,d,b);
};
const nearPolyline=(a:Pos[],b:Pos[]):boolean=>{
  for(let i=0;i+1<a.length;i++)
    for(let j=0;j+1<b.length;j++)
      if(nearSegments(a[i]!,a[i+1]!,b[j]!,b[j+1]!))return true;
  return false;
};
const pinsFor=(component:Item):Array<{nr:string;at:Pos}>=>{
  const symbol=BUILTIN_SYMBOLS.find(z=>z.id===component.zeichen);
  if(!symbol)fail('Ein vorhandenes Fachzeichen ist nicht im Cloud-Katalog; Netzschutz ist nicht möglich.');
  return symbol.anschluesse.map(p=>({nr:p.nr,at:terminalPos(component,p.nr)}));
};
const sameLayer=(item:Item,ebene:string)=>item.ebene===ebene;
/** The native Register rotates around the symbol centre, not its top-left
 * corner. Swapping width/height alone does not describe its actual envelope. */
const rotatedEnvelope=(part:Item):{minX:number;maxX:number;minY:number;maxY:number}=>{
  const symbol=BUILTIN_SYMBOLS.find(s=>s.id===part.zeichen);
  if(!symbol)fail('Unbekanntes Fachzeichen kann nicht platziert werden.');
  const angle=rotation(part.drehung)*Math.PI/180;
  const mirrored=mirror(part.gespiegelt);
  const x=Number(part.x),y=Number(part.y);
  const corners:Pos[]=[];
  for(const px of [0,symbol.w])for(const py of [0,symbol.h]){
    const xx=mirrored?symbol.w-px:px;
    const dx=xx-symbol.w/2,dy=py-symbol.h/2;
    corners.push({
      x:x+Math.round(symbol.w/2+dx*Math.cos(angle)-dy*Math.sin(angle)),
      y:y+Math.round(symbol.h/2+dx*Math.sin(angle)+dy*Math.cos(angle))
    });
  }
  return {minX:Math.min(...corners.map(p=>p.x)),maxX:Math.max(...corners.map(p=>p.x)),
    minY:Math.min(...corners.map(p=>p.y)),maxY:Math.max(...corners.map(p=>p.y))};
};
const checkFreeComponent=(part:Item,components:unknown[],wires:unknown[],
  maxWidth:number,maxHeight:number):void=>{
  const envelope=rotatedEnvelope(part);
  if(envelope.minX<0||envelope.minY<0||
    envelope.maxX>maxWidth||envelope.maxY>maxHeight)
    fail('Das gedrehte Fachzeichen liegt ausserhalb des Planblatts.');
  const newPins=pinsFor(part);
  for(const pin of newPins)
    if(pin.at.x<0||pin.at.y<0||pin.at.x>maxWidth||pin.at.y>maxHeight)
      fail('Anschluss liegt ausserhalb des Planblatts.');
  for(const other of components){
    if(!isRecord(other)||other.id===part.id||!sameLayer(other,String(part.ebene)))continue;
    const points=pinsFor(other);
    if(newPins.some(a=>points.some(b=>
      (a.at.x-b.at.x)**2+(a.at.y-b.at.y)**2<=NEAR**2)))
      fail('Das Bauteil überlagert eine bereits vorhandene Klemme.');
  }
  for(const wire of wires){
    if(!isRecord(wire)||!sameLayer(wire,String(part.ebene)))continue;
    const points=validPoints(wire.punkte);
    if(newPins.some(pin=>nearPath(pin.at,points)))
      fail('Bauteilklemme berührt eine vorhandene Leitung.');
  }
};
const wireClearance=(fromId:string,fromNr:string,toId:string,toNr:string,
  components:Item[],wires:Pos[][])=>{
  const foreignPins:Pos[]=[];
  for(const component of components){
    for(const pin of pinsFor(component)){
      if((component.id===fromId&&pin.nr===fromNr)||
        (component.id===toId&&pin.nr===toNr))continue;
      foreignPins.push(pin.at);
    }
  }
  return (points:Pos[])=>!foreignPins.some(pin=>nearPath(pin,points))&&
    !wires.some(wire=>nearPolyline(points,wire));
};

/** A new plan is returned; the input and all unrelated metadata remain unchanged. */
export const editSchematic=(raw:unknown,args:Item):{plan:Item;elementId:string;kind:string}=>{
  if(!isRecord(raw)||!Array.isArray(raw.teile)||!Array.isArray(raw.leitungen)||
    !Array.isArray(raw.texte)||!Array.isArray(raw.ebenen))
    fail('Schaltplan hat keine vollständige native Struktur.');
  const width=raw.breite,height=raw.hoehe;
  if(typeof width!=='number'||!Number.isSafeInteger(width)||width<100||width>4000||
    typeof height!=='number'||!Number.isSafeInteger(height)||height<100||height>4000)
    fail('Schaltplanmasse sind ungültig.');
  const components=raw.teile, wires=raw.leitungen, labels=raw.texte;
  if(components.length>120||wires.length>200||labels.length>120)
    fail('Schaltplan überschreitet die erlaubte Bearbeitungsgrenze.');
  if([...components,...wires,...labels].some(x=>!isRecord(x)||typeof x.id!=='string'))
    fail('Schaltplan enthält ungültige Elemente.');
  const ids=new Set([...components,...wires,...labels].map(x=>(x as Item).id as string));
  if(ids.size!==components.length+wires.length+labels.length)
    fail('Schaltplan enthält doppelte Elementkennungen.');
  const kind=args.operation;
  if(kind==='add_component'){
    allowedKeys(args,['componentId','symbolId','x','y','rotation','mirrored','layer','bmk']);
    const id=ident(args.componentId,'Bauteil');
    if(ids.has(id))fail('Bauteilkennung ist schon vergeben.');
    if(components.length>=120)fail('Maximale Bauteilanzahl erreicht.');
    const symbolId=nonempty(args.symbolId,'Fachzeichen',80);
    const symbol=BUILTIN_SYMBOLS.find(z=>z.id===symbolId);
    if(!symbol)fail('Nur eingebaute Fachzeichen sind über Cloud-MCP erlaubt.');
    const drehung=rotation(args.rotation),gespiegelt=mirror(args.mirrored);
    const x=grid(args.x,'X-Koordinate',width),y=grid(args.y,'Y-Koordinate',height);
    const ebene=layer(args.layer);
    if(!raw.ebenen.some(e=>isRecord(e)&&e.id===ebene))fail('Diese Ebene fehlt im Plan.');
    const prefix=symbol.kennbuchstabe||'Z';
    const used=new Set(components.map(p=>isRecord(p)?String(p.bmk||''):''));
    let n=1;
    while(used.has(prefix+n))n++;
    const bmk=args.bmk===undefined?prefix+n:nonempty(args.bmk,'Betriebsmittelkennzeichen',30);
    if(used.has(bmk))fail('Betriebsmittelkennzeichen ist bereits vergeben.');
    const part={id,zeichen:symbol.id,x,y,drehung,gespiegelt,bmk,nummern:{},
      gruppe:'',ebene};
    checkFreeComponent(part,components,wires,width,height);
    return {plan:{...raw,teile:[...components,part]},elementId:id,kind:'component'};
  }
  if(kind==='set_component_values'){
    allowedKeys(args,['componentId','values']);
    const id=ident(args.componentId,'Bauteil');
    const part=components.find(p=>isRecord(p)&&p.id===id);
    if(!isRecord(part))fail('Bauteil fehlt.');
    const values=args.values;
    if(!isRecord(values)||!Object.keys(values).length)fail('Mindestens ein Bauteilwert ist erforderlich.');
    const symbol=String(part.zeichen);
    const allowed = ['gleichspannung','wechselspannung','batterie'].includes(symbol)
      ? ['U'] : ['lampe','signalleuchte','widerstand'].includes(symbol)
      ? (symbol==='widerstand'?['R']:['R','Un']) : [];
    for(const [key,value] of Object.entries(values)){
      if(!allowed.includes(key)||typeof value!=='number'||!Number.isFinite(value)||value<=0||
        value>(key==='R'?1e9:1000))fail('Ungültiger oder nicht unterstützter Bauteilwert: '+key);
    }
    const old=isRecord(part.werte)?part.werte:{};
    return {plan:{...raw,teile:components.map(p=>p===part?{...part,werte:{...old,...values}}:p)},elementId:id,kind:'component'};
  }
  if(kind==='connect_terminals'){
    allowedKeys(args,['wireId','fromComponentId','fromTerminal','toComponentId','toTerminal','layer']);
    const id=ident(args.wireId,'Leitung');
    if(ids.has(id))fail('Leitungskennung ist schon vergeben.');
    if(wires.length>=200)fail('Maximale Leitungsanzahl erreicht.');
    const fromId=ident(args.fromComponentId,'Startbauteil');
    const toId=ident(args.toComponentId,'Zielbauteil');
    if(fromId===toId)fail('Leitungen am selben Bauteil werden nicht automatisch geführt.');
    const from=components.find(p=>isRecord(p)&&p.id===fromId);
    const to=components.find(p=>isRecord(p)&&p.id===toId);
    if(!isRecord(from)||!isRecord(to))fail('Mindestens ein Bauteil existiert nicht.');
    const fromNr=nonempty(args.fromTerminal,'Startklemme',20);
    const toNr=nonempty(args.toTerminal,'Zielklemme',20);
    const ebene=layer(args.layer);
    if(!raw.ebenen.some(e=>isRecord(e)&&e.id===ebene))fail('Diese Ebene fehlt im Plan.');
    if(from.ebene!==ebene||to.ebene!==ebene)fail('Bauteile und Leitung müssen dieselbe Ebene haben.');
    const start=terminalPos(from,fromNr),end=terminalPos(to,toNr);
    if(start.x===end.x&&start.y===end.y)fail('Anschlüsse liegen auf demselben Punkt.');
    for(const p of [start,end]){
      if(p.x<0||p.y<0||p.x>width||p.y>height)
        fail('Anschluss liegt ausserhalb des Planblatts.');
    }
    const duplicate=wires.some(w=>isRecord(w)&&(
      (w.vonTeil===fromId&&w.vonNr===fromNr&&w.nachTeil===toId&&w.nachNr===toNr)||
      (w.vonTeil===toId&&w.vonNr===toNr&&w.nachTeil===fromId&&w.nachNr===fromNr)
    ));
    if(duplicate)fail('Diese beiden Klemmen sind bereits direkt verbunden.');
    const teile=components.filter(isRecord);
    const leitungen=wires.filter(isRecord);
    const wirePoints=leitungen.map(w=>validPoints(w.punkte));
    if(wirePoints.reduce((sum,points)=>sum+points.length,0)>500)
      fail('Zu viele Leitungspunkte für automatische Führung. Kleineres Teilnetz wählen.');
    // Der Solver wertet momentan alle Ebenen aus. Auch Leitungen auf einer
    // anderen Ebene dürfen deshalb nicht berührt werden.
    const clear=wireClearance(fromId,fromNr,toId,toNr,teile,wirePoints);
    const punkte=planTools.leitungFuehren({...raw,teile,leitungen} as Parameters<typeof Schaltplan.leitungFuehren>[0],
      start,end,{teil:fromId,nr:fromNr},{teil:toId,nr:toNr},{
        schnell:true,
        kandidatErlaubt:points=>points.every(p=>p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height)&&clear(points)
      });
    if(punkte.length<2)fail('Kein eindeutiger Leitungsweg ohne fremde Kontakte oder Kreuzung gefunden.');
    const wire={id,punkte,ebene,vonTeil:fromId,vonNr:fromNr,nachTeil:toId,nachNr:toNr};
    return {plan:{...raw,leitungen:[...wires,wire]},elementId:id,kind:'wire'};
  }
  if(kind==='rotate_component'||kind==='mirror_component'||kind==='delete_component'){
    allowedKeys(args,kind==='rotate_component'?['componentId','rotation']:
      kind==='mirror_component'?['componentId','mirrored']:['componentId']);
    const id=ident(args.componentId,'Bauteil');
    const old=components.find(c=>isRecord(c)&&c.id===id);
    if(!isRecord(old))fail('Bauteil existiert nicht.');
    // The simulation can form contacts across layers. Refuse all explicit
    // and geometric connections before changing or removing a component.
    if(wires.some(w=>isRecord(w)&&(w.vonTeil===id||w.nachTeil===id)))
      fail('Bauteil hat Leitungsanschlüsse. Zuerst gezielt Leitungen entfernen.');
    rotation(old.drehung);
    mirror(old.gespiegelt);
    const pins=pinsFor(old);
    for(const w of wires.filter(isRecord))
      if(pins.some(p=>nearPath(p.at,validPoints(w.punkte))))
        fail('Bauteil berührt bereits eine Leitung.');
    for(const other of components.filter(isRecord)){
      if(other.id===id)continue;
      const otherPins=pinsFor(other);
      if(pins.some(p=>otherPins.some(q=>(p.at.x-q.at.x)**2+(p.at.y-q.at.y)**2<=NEAR**2)))
        fail('Bauteilklemme berührt ein anderes Bauteil.');
    }
    if(kind==='delete_component')
      return {plan:{...raw,teile:components.filter(c=>c!==old)},elementId:id,kind:'component'};
    let changed:Item;
    if(kind==='rotate_component'){
      if(args.rotation===undefined)fail('Drehung fehlt.');
      const drehung=rotation(args.rotation);
      if(drehung===rotation(old.drehung))fail('Bauteildrehung ist bereits unverändert.');
      changed={...old,drehung};
    }else{
      if(typeof args.mirrored!=='boolean')fail('Spiegelung muss true oder false sein.');
      if(args.mirrored===mirror(old.gespiegelt))fail('Spiegelung ist bereits unverändert.');
      changed={...old,gespiegelt:args.mirrored};
    }
    // Evaluate candidate contact geometry on all layers without changing
    // the stored layer assignment of any element.
    const ebene=String(changed.ebene??'plan');
    checkFreeComponent({...changed,ebene},
      components.filter(isRecord).map(c=>({...c,ebene})),
      wires.filter(isRecord).map(w=>({...w,ebene})),width,height);
    return {plan:{...raw,teile:components.map(c=>c===old?changed:c)},elementId:id,kind:'component'};
  }
  if(kind==='move_connected_component'){
    allowedKeys(args,['componentId','x','y']);
    const id=ident(args.componentId,'Bauteil');
    const old=components.find(c=>isRecord(c)&&c.id===id);
    if(!isRecord(old))fail('Bauteil existiert nicht.');
    const x=grid(args.x,'X-Koordinate',width),y=grid(args.y,'Y-Koordinate',height);
    if(old.x===x&&old.y===y)fail('Bauteilposition ist bereits unverändert.');
    const attached=wires.filter(isRecord).filter(w=>w.vonTeil===id||w.nachTeil===id);
    if(!attached.length||attached.length>8)fail('Ein bis acht explizit gebundene Leitungen erforderlich.');
    // Bound work in the cloud runtime; reject unknown symbols, malformed
    // geometry and legacy terminal aliases before invoking native routing.
    const allParts=components.filter(isRecord);
    for(const p of allParts){
      if(typeof p.x!=='number'||!Number.isFinite(p.x)||typeof p.y!=='number'||!Number.isFinite(p.y))
        fail('Ungültige Bauteilposition.');
      rotation(p.drehung);mirror(p.gespiegelt);pinsFor(p);
    }
    const allWires=wires.filter(isRecord);
    if(allWires.reduce((n,w)=>n+validPoints(w.punkte).length,0)>500)
      fail('Zu viele Leitungspunkte für das Nachziehen.');
    const equal=(a:Pos,b:Pos)=>a.x===b.x&&a.y===b.y;
    const endpoints=(wire:Item,parts:Item[])=>{
      const from=parts.find(p=>p.id===wire.vonTeil),to=parts.find(p=>p.id===wire.nachTeil);
      if(!from||!to||from===to||typeof wire.vonNr!=='string'||typeof wire.nachNr!=='string')
        return fail('Leitungsenden sind nicht eindeutig an zwei Bauteile gebunden.');
      return [terminalPos(from,wire.vonNr),terminalPos(to,wire.nachNr)] as const;
    };
    for(const w of attached){
      const pts=validPoints(w.punkte),[a,b]=endpoints(w,allParts);
      if(w.schiene!==undefined||!equal(pts[0]!,a)||!equal(pts[pts.length-1]!,b))
        fail('Gebundene Leitung hat keine eindeutigen Endpunkte.');
    }
    const moved={...old,x,y};
    const envelope=rotatedEnvelope(moved);
    if(envelope.minX<0||envelope.minY<0||envelope.maxX>width||envelope.maxY>height)
      fail('Das Fachzeichen liegt ausserhalb des Planblatts.');
    for(const pin of pinsFor(moved))
      if(pin.at.x<0||pin.at.y<0||pin.at.x>width||pin.at.y>height)
        fail('Anschluss liegt ausserhalb des Planblatts.');
    // Native editor uses the same contact rules as the simulator.
    // Work on a clone and reject every change in the contact graph, even
    // when the native editor would merely warn about its fallback route.
    const plan=structuredClone(raw) as unknown as Parameters<typeof Schaltplan.vorherMerken>[0];
    const before=planTools.vorherMerken(plan);
    const target=plan.teile.find(p=>p.id===id)!;
    target.x=x;target.y=y;
    const report=planTools.nachziehen(plan,before,[id],{schnell:true});
    if(report.length!==attached.length||report.some(r=>r.stufe!==1)||
      planTools.veraendert(plan,before).length)
      fail('Leitungen können nicht ohne Änderung der Kontakte nachgezogen werden.');
    const newParts=plan.teile as unknown as Item[];
    for(const w of plan.leitungen){
      const original=allWires.find(p=>p.id===w.id)!;
      if(!attached.includes(original)){
        if(JSON.stringify(w)!==JSON.stringify(original))fail('Unbeteiligte Leitung wurde verändert.');
        continue;
      }
      const pts=validPoints(w.punkte),[a,b]=endpoints(w as unknown as Item,newParts);
      if(!equal(pts[0]!,a)||!equal(pts[pts.length-1]!,b)||
        pts.some(p=>p.x<0||p.y<0||p.x>width||p.y>height)||
        pts.some((p,i)=>i>0&&p.x!==pts[i-1]!.x&&p.y!==pts[i-1]!.y)||
        planTools.ueberlappt(pts,plan.leitungen,w.id))
        fail('Nachgezogene Leitung ist nicht eindeutig oder liegt ausserhalb des Plans.');
    }
    return {plan:plan as unknown as Item,elementId:id,kind:'component'};
  }
  if(kind==='move_component'){
    allowedKeys(args,['componentId','x','y']);
    const id=ident(args.componentId,'Bauteil');
    const old=components.find(c=>isRecord(c)&&c.id===id);
    if(!isRecord(old))fail('Bauteil existiert nicht.');
    const x=grid(args.x,'X-Koordinate',width),y=grid(args.y,'Y-Koordinate',height);
    if(old.x===x&&old.y===y)fail('Bauteilposition ist bereits unverändert.');
    const attached=wires.some(w=>isRecord(w)&&
      (w.vonTeil===id||w.nachTeil===id));
    if(attached)fail('Bauteil hat Leitungsanschlüsse. Bitte im nativen Editor mit Netzschutz verschieben.');
    // Even without explicit endpoint IDs, an old plan may have implicit
    // geometric contacts. Reject movement if any old terminal touches a wire.
    const oldLayer=typeof old.ebene==='string'?old.ebene:'plan';
    for(const wire of wires){
      if(!isRecord(wire)||wire.ebene!==oldLayer)continue;
      const points=validPoints(wire.punkte);
      if(pinsFor(old).some(pin=>nearPath(pin.at,points)))
        fail('Bauteil berührt bereits eine Leitung. Manuell mit Netzschutz verschieben.');
    }
    const symbol=BUILTIN_SYMBOLS.find(s=>s.id===old.zeichen);
    if(!symbol)fail('Unbekanntes Bauteil kann nicht über Cloud-MCP verschoben werden.');
    const rotated=Number(old.drehung||0);
    if(![0,90,180,270].includes(rotated))fail('Bauteildrehung ist ungültig.');
    const moved={...old,x,y};
    checkFreeComponent(moved,components,wires,width,height);
    return {plan:{...raw,teile:components.map(c=>c===old?moved:c)},
      elementId:id,kind:'component'};
  }
  if(kind==='rename_label'||kind==='delete_label'){
    allowedKeys(args,kind==='rename_label'?['labelId','labelText']:['labelId']);
    const id=ident(args.labelId,'Beschriftung');
    const old=labels.find(l=>isRecord(l)&&l.id===id);
    if(!isRecord(old))fail('Beschriftung existiert nicht.');
    if(kind==='delete_label')
      return {plan:{...raw,texte:labels.filter(l=>l!==old)},elementId:id,kind:'label'};
    const t=nonempty(args.labelText,'Beschriftung',200);
    if(old.t===t)fail('Beschriftung ist bereits unverändert.');
    return {plan:{...raw,texte:labels.map(l=>l===old?{...old,t}:l)},elementId:id,kind:'label'};
  }
  if(kind==='delete_wire'){
    allowedKeys(args,['wireId']);
    const id=ident(args.wireId,'Leitung');
    const old=wires.find(w=>isRecord(w)&&w.id===id);
    if(!isRecord(old))fail('Leitung existiert nicht.');
    // Only the explicitly selected wire is removed. Other paths may
    // still connect the terminals; no electrical validation is implied.
    return {plan:{...raw,leitungen:wires.filter(w=>w!==old)},elementId:id,kind:'wire'};
  }
  if(kind==='move_label'){
    allowedKeys(args,['labelId','x','y']);
    const id=ident(args.labelId,'Beschriftung');
    const old=labels.find(l=>isRecord(l)&&l.id===id);
    if(!isRecord(old))fail('Beschriftung existiert nicht.');
    const x=grid(args.x,'X-Koordinate',width),y=grid(args.y,'Y-Koordinate',height);
    if(old.x===x&&old.y===y)fail('Beschriftungsposition ist bereits unverändert.');
    const moved={...old,x,y};
    return {plan:{...raw,texte:labels.map(l=>l===old?moved:l)},
      elementId:id,kind:'label'};
  }
  if(kind==='add_label'){
    allowedKeys(args,['labelId','labelText','x','y','layer']);
    const id=ident(args.labelId,'Beschriftung');
    if(ids.has(id))fail('Beschriftungskennung ist schon vergeben.');
    if(labels.length>=120)fail('Maximale Beschriftungsanzahl erreicht.');
    const t=nonempty(args.labelText,'Beschriftung',200);
    const x=grid(args.x,'X-Koordinate',width),y=grid(args.y,'Y-Koordinate',height);
    const ebene=layer(args.layer);
    if(!raw.ebenen.some(e=>isRecord(e)&&e.id===ebene))fail('Diese Ebene fehlt im Plan.');
    return {plan:{...raw,texte:[...labels,{id,x,y,t,ebene}]},elementId:id,kind:'label'};
  }
  return fail('Unbekannte Schaltplanaktion.');
};
