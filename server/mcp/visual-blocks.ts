// @ts-expect-error Classic browser build has no module declaration.
import compiledObjects from '../../quell/core/gfx/objects.js';
// @ts-expect-error Classic browser build has no module declaration.
import compiledInk from '../../quell/core/ink/geometry.js';
const gfx:typeof GfxObjects=compiledObjects;
const ink:typeof InkGeometry=compiledInk;

type Obj=Record<string,unknown>;
const fail=(s:string):never=>{throw new Error(s);};
const obj=(v:unknown,keys:string[]):Obj=>{if(!v||typeof v!=='object'||Array.isArray(v))return fail('Objekt erwartet.');const o=v as Obj;if(Object.keys(o).some(k=>!keys.includes(k)))return fail('Unbekanntes Feld.');return o;};
const str=(v:unknown,max:number):string=>typeof v==='string'&&v.trim()&&v.length<=max?v.trim():fail('Ungültiger Text.');
const id=(v:unknown):string=>{const s=str(v,64);return /^[a-zA-Z0-9_-]+$/.test(s)&&!['__proto__','constructor','prototype'].includes(s)?s:fail('Ungültige ID.');};
const num=(v:unknown,min:number,max:number):number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?v:fail('Ungültige Koordinate.');
const choice=(v:unknown,values:string[]):string=>typeof v==='string'&&values.includes(v)?v:fail('Unbekannter Wert.');
const color=(v:unknown):string=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)?v:fail('Ungültige Farbe.');
const arr=(v:unknown,min:number,max:number):unknown[]=>Array.isArray(v)&&v.length>=min&&v.length<=max?v:fail('Ungültige Anzahl.');
export const papers=['blanko','liniert','kariert','punkte','mm','cornell','noten'];
export const forms=['rund','kasten','pille','ellipse','raute','sechseck'];
export const shapes=['rechteck','ellipse','dreieck','raute','linie','pfeil','text','notiz','verbindung','stift'];
export const alignments=['left','center','right','top','middle','bottom','horizontal','vertical'];
export const mindmapLimit=200;

function makeNode(value:unknown):Obj {
 const input=obj(value,['id','text','parentId','side','color','form']);
 const node:Obj={id:id(input.id),text:str(input.text,500),eltern:input.parentId===null?null:id(input.parentId)};
 if(input.side!==undefined)node.seite=choice(input.side,['links','rechts']);
 if(input.color!==undefined)node.farbe=color(input.color);
 if(input.form!==undefined)node.form=choice(input.form,forms);
 return node;
}

function validateTree(nodes:Obj[]) {
 const byId=new Map(nodes.map(node=>[node.id,node]));
 if(byId.size!==nodes.length||nodes.filter(node=>node.eltern===null).length!==1)
   fail('Genau eine Wurzel und eindeutige Kennungen sind erforderlich.');
 for(const node of nodes){
   let parent=node.eltern;
   const seen=new Set([node.id]);
   while(parent!==null){
     if(seen.has(parent)||seen.size>=20)fail('Die Verschachtelung ist zyklisch oder zu tief.');
     seen.add(parent);
     const ancestor=byId.get(parent);
     if(!ancestor)return fail('Elternknoten fehlt.');
     parent=ancestor.eltern;
   }
 }
 return byId;
}

function makeConnection(value:unknown):{id:string;von:string;zu:string} {
 const input=obj(value,['id','from','to']);
 return {id:id(input.id),von:id(input.from),zu:id(input.to)};
}

function validateConnections(links:Obj[],nodes:ReadonlyMap<unknown,Obj>):void {
 const ids=new Set(nodes.keys()),pairs=new Set<string>();
 for(const link of links){
   const {id,von,zu}=link;
   if(typeof von!=='string'||typeof zu!=='string')fail('Querverbindung ohne Knotenkennung.');
   const pair=JSON.stringify([von,zu].sort());
   if(ids.has(id)||!nodes.has(von)||!nodes.has(zu)||von===zu||pairs.has(pair))
     fail('Doppelte oder ungültige Querverbindung.');
   ids.add(id);
   pairs.add(pair);
 }
}

export function mindmap(nodes:unknown,connections:unknown=[]):Obj{
 const knoten=arr(nodes,1,mindmapLimit).map(makeNode);
 const verbindungen=arr(connections,0,mindmapLimit).map(makeConnection);
 validateConnections(verbindungen,validateTree(knoten));
 return {knoten,verbindungen,aufbau:'karte'};
}
export function board(input:unknown,existing:Obj[]=[]):Obj[]{
 const added=arr(input,0,100).map(v=>{const o=obj(v,['id','kind','x','y','width','height','color','text','filled','from','to','points','pressure','strokeWidth','marker','rotation']);const art=choice(o.kind,shapes),s:Obj={id:id(o.id),art,farbe:color(o.color??'#2f8ab5')};
 if(art==='verbindung'){
   if(Object.keys(o).some(k=>!['id','kind','color','from','to'].includes(k)))fail('Ungültige Verbindungsfelder.');
   s.von=id(o.from);s.nach=id(o.to);return s;
 }
 if(art==='stift'){
   if(Object.keys(o).some(k=>!['id','kind','color','points','pressure','strokeWidth','marker'].includes(k)))fail('Ungültige Stiftfelder.');
   const pts=arr(o.points,2,500).map(p=>{const pair=arr(p,2,2);return [num(pair[0],-10000,10000),num(pair[1],-10000,10000)];});
   if(pts.every(p=>p[0]===pts[0]![0]&&p[1]===pts[0]![1]))fail('Leerer Strich.');
   s.pts=pts;
   if(o.pressure!==undefined){const pressure=arr(o.pressure,pts.length,pts.length).map(v=>num(v,0.05,1));s.pressure=pressure;}
   if(o.strokeWidth!==undefined)s.strichBreite=num(o.strokeWidth,0.1,50);
   if(o.marker!==undefined){if(typeof o.marker!=='boolean')fail('Ungültiger Marker.');s.marker=o.marker;}
   return s;
 }
 if(o.points!==undefined||o.pressure!==undefined||o.marker!==undefined||o.from!==undefined||o.to!==undefined)fail('Felder passen nicht zur Form.');
 if(o.strokeWidth!==undefined)s.strichBreite=num(o.strokeWidth,0.1,50);
 if(o.rotation!==undefined)s.rotation=num(o.rotation,-360,360);
 s.x=num(o.x,-10000,10000);s.y=num(o.y,-10000,10000);if(art!=='text'){const min=art==='linie'||art==='pfeil'?-10000:1;s.w=num(o.width,min,10000);s.h=num(o.height,min,10000);if(s.w===0&&s.h===0)fail('Leere Linie.');}
 if(art==='notiz'||art==='text'||o.text!==undefined)s.text=str(o.text,1000);if(o.filled!==undefined){if(typeof o.filled!=='boolean')fail('Ungültige Füllung.');s.gefuellt=o.filled;}return s;});
 const all=[...existing,...added],ids=new Set(all.map(s=>s.id));if(all.length>200||ids.size!==all.length)fail('Zu viele oder doppelte Formen.');
 const endpoints=new Set(all.filter(s=>s.art!=='verbindung').map(s=>s.id));for(const s of added)if(s.art==='verbindung'&&(!endpoints.has(s.von)||!endpoints.has(s.nach)||s.von===s.nach))fail('Endpunkt fehlt.');
 return added;
}
export function sheet(paper:unknown,pages:unknown=1,orientation:unknown='portrait'):Obj {
 const n=num(pages,1,10);
 if(!Number.isInteger(n))fail('Ganze Seitenzahl erforderlich.');
 const landscape=choice(orientation,['portrait','landscape'])==='landscape';
 const height=landscape?595.28:841.89;
 return {papier:choice(paper??'blanko',papers),blattBreite:landscape?841.89:595.28,
   blattHoehe:Math.round(height*n*100)/100,raumVersion:1,...(landscape?{blattAusrichtung:'quer'}:{})};
}

export const sheetMarkKinds=['text','stift','marker','line','arrow','rectangle','ellipse','triangle'];

export function readSheetMark(value:unknown):Obj {
 if(!value||typeof value!=='object'||Array.isArray(value))return {supported:false};
 const mark=value as Obj;
 const base={id:mark.id,art:mark.art};
 if(typeof mark.art!=='string'||!sheetMarkKinds.includes(mark.art))return {...base,supported:false};
 const fields=['farbe','point','pts','text','breiteBox','fontSize','fett','breite','breiteFest','dreh','gesperrt','groupId','schrift','ausricht'];
 return {...base,...Object.fromEntries(fields.filter(key=>Object.hasOwn(mark,key)).map(key=>[key,mark[key]]))};
}

function markDimensions(block:Obj):{width:number;height:number} {
 if(block.type==='pdfseite')return {width:num(block.bw,1,10000),height:num(block.bh,1,10000)};
 return {width:num(block.blattBreite??595.28,1,10000),height:num(block.blattHoehe??841.89,1,10000)};
}

/** Store marks in the point coordinate system consumed by Marken.schicht. */
export function appendSheetMarks(block:Obj,input:unknown):Obj[] {
 const existing=block.marken===undefined?[]:block.marken;
 if(!Array.isArray(existing)||(existing.length&&block.raumVersion!==1))
   return fail('Die vorhandenen Zeichenmarken benötigen zuerst die native Koordinatenmigration.');
 const {width,height}=markDimensions(block);
 const ids=new Set(existing.map(mark=>mark?.id));
 const added=arr(input,1,40).map(value=>{
   const entry=obj(value,['id','kind','color','points','strokeWidth','text','x','y','width','fontSize','bold']);
   const art=choice(entry.kind,sheetMarkKinds),markId=id(entry.id);
   if(ids.has(markId))fail('Doppelte Kennung einer Zeichenmarke.');
   ids.add(markId);
   const mark={id:markId,art,farbe:color(entry.color??(art==='marker'?'#ffe164':'#2e77a5'))};
   if(art==='text'){
     if(entry.points!==undefined||entry.strokeWidth!==undefined)fail('Strichfelder passen nicht zu Text.');
     if(entry.bold!==undefined&&typeof entry.bold!=='boolean')fail('Ungültiges Textformat.');
     const x=num(entry.x,0,width),y=num(entry.y,0,height);
     const fontSize=num(entry.fontSize??18,8,96),breiteBox=num(entry.width,24,width-x);
     if(y+fontSize>height)fail('Textanker liegt zu nah am Blattrand.');
     return {...mark,point:[x,y],text:str(entry.text,1000),breiteBox,fontSize,fett:entry.bold??false};
   }
   if(['text','x','y','width','fontSize','bold'].some(key=>entry[key]!==undefined))
     fail('Textfelder passen nicht zu dieser Zeichenmarke.');
   const stroke=art==='stift'||art==='marker';
   const pts=arr(entry.points,2,stroke?500:2).map(value=>{
     const [x,y]=arr(value,2,2);
     return [num(x,0,width),num(y,0,height)];
   });
   const [a,b]=pts;
   if(!a||!b||pts.every(point=>point[0]===a[0]&&point[1]===a[1]))fail('Leere Zeichenmarke.');
   if(['rectangle','ellipse','triangle'].includes(art)&&(a![0]===b![0]||a![1]===b![1]))
     fail('Die Fläche braucht Breite und Höhe.');
   const breiteFest=num(entry.strokeWidth??(art==='marker'?10:2),0.5,48);
   return {...mark,pts,breite:breiteFest,breiteFest};
 });
 if(existing.length+added.length>500)fail('Zu viele Zeichenmarken auf einer Seite.');
 return [...existing,...added];
}

export function moveSheetMark(block:Obj,args:Obj):Obj[] {
 if(block.raumVersion!==1||!Array.isArray(block.marken))
   return fail('Die Zeichenmarken benötigen native Blattkoordinaten.');
 const target=id(args.elementId);
 const marks=block.marken as Obj[];
 const matches=marks.filter(mark=>mark?.id===target);
 const [mark]=matches;
 if(matches.length!==1||!mark||typeof mark.art!=='string'||!sheetMarkKinds.includes(mark.art))
   return fail('Zeichenmarke fehlt, ist mehrdeutig oder wird nicht unterstützt.');
 if(mark.gesperrt||mark.groupId)fail('Gesperrte und gruppierte Zeichenmarken müssen zuerst freigegeben werden.');
 const dx=num(args.dx,-10000,10000),dy=num(args.dy,-10000,10000);
 if(!dx&&!dy)fail('Verschiebung ist leer.');
 const points=mark.art==='text'?[mark.point]:mark.pts;
 if(!Array.isArray(points)||!points.length||points.length>500||points.some(point=>
   !Array.isArray(point)||point.length!==2||point.some(coord=>typeof coord!=='number'||!Number.isFinite(coord))))
   fail('Ungültige Koordinaten der Zeichenmarke.');
 const {width,height}=markDimensions(block);
 const moved:Obj=ink.move({...mark},dx,dy);
 const bounds=ink.bounds(moved);
 if(bounds.x<0||bounds.y<0||bounds.x+bounds.width>width||bounds.y+bounds.height>height)
   fail('Die verschobene Zeichenmarke reicht über das Blatt.');
 return marks.map(value=>value===mark?moved:value);
}

/** Patch only named objects; unrelated native fields and objects survive. */
export function editNode(value:unknown,operation:string,args:Obj):Obj{
 if(!value||typeof value!=='object'||Array.isArray(value))return fail('Mindmap fehlt.');
 const map=value as Obj;
 if(!Array.isArray(map.knoten)||!Array.isArray(map.verbindungen))return fail('Ungültige Mindmap.');
 const nodes=map.knoten as Obj[],links=map.verbindungen as Obj[];
 if(nodes.length>mindmapLimit||links.length>mindmapLimit||
    [...nodes,...links].some(entry=>!entry||typeof entry!=='object'||Array.isArray(entry)||typeof entry.id!=='string'))
   return fail('Mindmap zu gross oder ungültig.');
 if(operation==='append_node'){
   if(nodes.length>=mindmapLimit)fail('Die Mindmap hat die Knotengrenze erreicht.');
   const node=makeNode(args.node);
   if(node.eltern===null)fail('Ein neuer Knoten braucht einen Elternknoten.');
   const knoten=[...nodes,node];
   validateConnections(links,validateTree(knoten));
   return {...map,knoten};
 }
 if(operation==='add_connection'){
   if(links.length>=mindmapLimit)fail('Die Mindmap hat die Verbindungsgrenze erreicht.');
   const verbindungen=[...links,makeConnection(args.connection)];
   validateConnections(verbindungen,validateTree(nodes));
   return {...map,verbindungen};
 }
 if(operation==='remove_connection'){
   const target=id(args.elementId);
   if(!links.some(link=>link.id===target))fail('Querverbindung fehlt.');
   return {...map,verbindungen:links.filter(link=>link.id!==target)};
 }
 const target=id(args.elementId),n=nodes.find(k=>k.id===target);
 if(!n)return fail('Knoten fehlt.');
 if(operation==='move_node'){
   if(n.eltern===null)fail('Die Wurzel kann nicht verschoben werden.');
   const eltern=id(args.parentId);
   if(n.eltern===eltern)fail('Der Knoten hat bereits diesen Elternknoten.');
   const moved={...n,eltern};
   const knoten=[...nodes.filter(node=>node!==n),moved];
   validateTree(knoten);
   return {...map,knoten};
 }
 if(operation==='rename_node')return {...map,knoten:nodes.map(k=>k===n?{...k,text:str(args.text,500)}:k)};
 if(operation==='style_node'){
   const patch:Obj={};
   if(args.color!==undefined)patch.farbe=color(args.color);
   if(args.form!==undefined)patch.form=choice(args.form,forms);
   if(args.collapsed!==undefined){if(typeof args.collapsed!=='boolean')fail('Ungültiger Zustand.');patch.zu=args.collapsed;}
   if(!Object.keys(patch).length)fail('Keine Änderung.');
   return {...map,knoten:nodes.map(k=>k===n?{...k,...patch}:k)};
 }
 if(operation==='delete_branch'){
   if(n.eltern===null)fail('Die Wurzel darf nicht gelöscht werden.');
   const removed=new Set<unknown>([target]);
   for(let i=0;i<nodes.length;i++)for(const k of nodes)if(removed.has(k.eltern))removed.add(k.id);
   return {...map,knoten:nodes.filter(k=>!removed.has(k.id)),verbindungen:links.filter(l=>!removed.has(l.von)&&!removed.has(l.zu))};
 }
 return fail('Unbekannte Knotenoperation.');
}
export function editShape(value:unknown,operation:string,args:Obj):Obj[]{
 if(!Array.isArray(value)||value.length>200||value.some(s=>!s||typeof s!=='object'||Array.isArray(s)))return fail('Ungültige Formen.');
 const all=value as Obj[],target=id(args.elementId),s=all.find(o=>o.id===target);
 if(!s)return fail('Form fehlt.');
 if(operation==='lock_shape'){
   if(typeof args.locked!=='boolean')return fail('locked muss boolesch sein.');
   return all.map(o=>o===s?{...o,locked:args.locked}:o);
 }
 if(s.locked===true||s.groupId||Array.isArray(s.groupPath)&&s.groupPath.length)return fail('Gesperrte oder gruppierte Formen im nativen Editor bearbeiten.');
 if(operation==='order_shape'){
   if(s.art==='verbindung')return fail('Verbindungen liegen immer hinter Formen.');
   const order=choice(args.order,['front','back','forward','backward']);
   const ordered=all.filter(o=>o.art!=='verbindung'),i=ordered.indexOf(s);
   const dest=order==='front'?ordered.length-1:order==='back'?0:order==='forward'?Math.min(i+1,ordered.length-1):Math.max(i-1,0);
   ordered.splice(i,1);ordered.splice(dest,0,s);let index=0;
   return all.map(o=>o.art==='verbindung'?o:ordered[index++]!);
 }
 if(operation==='delete_shape'){
   const removed=all.filter(o=>o===s||o.art==='verbindung'&&(o.von===target||o.nach===target));
   if(removed.some(o=>o.locked===true||o.groupId||Array.isArray(o.groupPath)&&o.groupPath.length))return fail('Verknüpfte Objekte sind gesperrt oder gruppiert.');
   return all.filter(o=>!removed.includes(o));
 }
 if(s.art==='stift'){
   if(operation==='move_stroke'){
     const dx=num(args.dx,-10000,10000),dy=num(args.dy,-10000,10000);
     const pts=arr(s.pts,2,500).map(p=>{const pair=arr(p,2,2);return [num(num(pair[0],-10000,10000)+dx,-10000,10000),num(num(pair[1],-10000,10000)+dy,-10000,10000)];});
     return all.map(o=>o===s?{...o,pts}:o);
   }
   if(operation==='style_shape'){
     if(args.text!==undefined||args.filled!==undefined)return fail('Stift unterstützt keinen Text oder Flächenfüllung.');
     const patch:Obj={};
     if(args.color!==undefined)patch.farbe=color(args.color);
     if(args.strokeWidth!==undefined)patch.strichBreite=num(args.strokeWidth,0.1,50);
     if(args.marker!==undefined){if(typeof args.marker!=='boolean')fail('Ungültiger Marker.');patch.marker=args.marker;}
     if(!Object.keys(patch).length)fail('Keine Änderung.');
     return all.map(o=>o===s?{...o,...patch}:o);
   }
   return fail('Stift mit move_stroke oder style_shape bearbeiten.');
 }
 if(!['rechteck','ellipse','dreieck','raute','linie','pfeil','text','notiz'].includes(String(s.art)))return fail('Diese Form benötigt eine spezielle Bearbeitung.');
 const patch:Obj={};
 if(operation==='move_shape'){patch.x=num(args.x,-10000,10000);patch.y=num(args.y,-10000,10000);}
 else if(operation==='rotate_shape'){patch.rotation=num(args.rotation,-360,360);}
 else if(operation==='resize_shape'){
   if(s.art==='text')return fail('Text hat keine feste Grösse.');
   const min=s.art==='linie'||s.art==='pfeil'?-10000:1;
   patch.w=num(args.width,min,10000);patch.h=num(args.height,min,10000);
   if(patch.w===0&&patch.h===0)fail('Leere Linie.');
 }else if(operation==='style_shape'){
   if(args.marker!==undefined)return fail('Marker nur für Stift.');
   if(args.strokeWidth!==undefined)patch.strichBreite=num(args.strokeWidth,0.1,50);
   if(args.color!==undefined)patch.farbe=color(args.color);
   if(args.filled!==undefined){if(typeof args.filled!=='boolean')fail('Ungültige Füllung.');patch.gefuellt=args.filled;}
   if(args.text!==undefined){if(!['text','notiz','rechteck','ellipse','dreieck','raute'].includes(String(s.art)))fail('Text nicht unterstützt.');patch.text=str(args.text,1000);}
   if(!Object.keys(patch).length)fail('Keine Änderung.');
 }else return fail('Unbekannte Formoperation.');
 return all.map(o=>o===s?{...o,...patch}:o);
}

/** Uses the same group expansion, lock checks and geometry as the Whiteboard. */
export function editSelection(value:unknown,operation:string,args:Obj):GfxObject[]{
 if(!Array.isArray(value)||value.length>200)return fail('Ungültige Auswahlfläche.');
 const objects:GfxObject[]=value.map(form=>{
   if(!form||typeof form!=='object'||Array.isArray(form)||typeof form.id!=='string'||
       (form.groupId!==undefined&&typeof form.groupId!=='string')||
       (form.groupPath!==undefined&&(!Array.isArray(form.groupPath)||form.groupPath.length>20||
         !form.groupPath.every((group:unknown)=>typeof group==='string'))))
     return fail('Ungültiges Zeichenobjekt.');
   return form as GfxObject;
 });
 const known=new Set(objects.map(form=>form.id));
 if(known.size!==objects.length)fail('Doppelte Objektkennungen auf dem Whiteboard.');
 const requested=arr(args.selection,1,40).map(id);
 const selected=new Set(requested);
 if(selected.size!==requested.length||requested.some(wanted=>!known.has(wanted)))
   fail('Auswahl enthält doppelte oder fehlende Objekte.');
 const ids=gfx.expand(objects,selected);
 const members=objects.filter(form=>ids.has(form.id));
 if(members.some(form=>form.art==='verbindung'))fail('Verbindungen werden über ihre Endpunkte bearbeitet.');
 if(gfx.locked(objects,ids))fail('Mindestens ein Objekt der Auswahl ist gesperrt.');
 if(operation==='group_selection'){
   if(members.length<2)fail('Zum Gruppieren mindestens zwei Objekte auswählen.');
   const groupId=id(args.groupId);
   if(known.has(groupId)||objects.some(form=>form.groupId===groupId||form.groupPath?.includes(groupId)))
     fail('Gruppenkennung wird schon verwendet.');
   if(members.some(form=>(form.groupPath?.length??0)>=20))fail('Gruppen sind zu tief verschachtelt.');
   return gfx.group(objects,ids,groupId);
 }
 if(operation==='ungroup_selection'){
   if(!members.some(form=>form.groupId))fail('Die Auswahl enthält keine Gruppe.');
   return gfx.group(objects,ids,null);
 }
 if(operation==='order_selection'){
   const order=choice(args.order,['front','back','forward','backward']) as Parameters<typeof gfx.reorder>[2];
   return gfx.reorder(objects,ids,order);
 }
 let result:GfxObject[];
 if(operation==='move_selection'){
   const dx=num(args.dx,-10000,10000),dy=num(args.dy,-10000,10000);
   result=objects.map(form=>ids.has(form.id)?gfx.move(form,dx,dy):form);
 }else if(operation==='align_selection'){
   const command=choice(args.alignment,alignments);
   const needed=command==='horizontal'||command==='vertical'?3:2;
   if(gfx.units(objects,ids).length<needed)fail('Für diese Aktion mehr einzelne Objekte oder Gruppen auswählen.');
   result=gfx.align(objects,ids,command);
 }else return fail('Unbekannte Auswahlaktion.');
 // Validate only the coordinates that the selection command actually writes.
 for(const form of result){
   if(!ids.has(form.id))continue;
   if(form.art==='stift'){
     arr(form.pts,1,2000).forEach(raw=>{
       const point=arr(raw,2,4);
       num(point[0],-10000,10000);num(point[1],-10000,10000);
     });
   }else{num(form.x,-10000,10000);num(form.y,-10000,10000);}
 }
 return result;
}
