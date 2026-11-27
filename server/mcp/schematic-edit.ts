/** Strict, additive edits to RED ION's persisted block.plan format.
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
