/** Strict, additive edits to RED ION's persisted block.plan format.
 * Client geometry is limited to the canonical 10px grid and BUILTIN_SYMBOLS.
 * This is an editor helper, NOT an electrical safety or standards verifier.
 */
import {BUILTIN_SYMBOLS} from './symbol-catalog.ts';

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
    const elementWidth=drehung%180===0?symbol.w:symbol.h;
    const elementHeight=drehung%180===0?symbol.h:symbol.w;
    if(x+elementWidth>width||y+elementHeight>height)
      fail('Das Fachzeichen liegt ausserhalb des Planblatts.');
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
    // Orthogonal routing only. Junctions, crossings and electrical behaviour
    // are NOT verified by this helper.
    const corner={x:end.x,y:start.y};
    const punkte=start.x===end.x||start.y===end.y?[start,end]:[start,corner,end];
    const wire={id,punkte,ebene,vonTeil:fromId,vonNr:fromNr,nachTeil:toId,nachNr:toNr};
    return {plan:{...raw,leitungen:[...wires,wire]},elementId:id,kind:'wire'};
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
