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
export function mindmap(nodes:unknown,connections:unknown=[]):Obj{
 const knoten=arr(nodes,1,100).map(v=>{const o=obj(v,['id','text','parentId','side','color','form']);const k:Obj={id:id(o.id),text:str(o.text,500),eltern:o.parentId===null?null:id(o.parentId)};
 if(o.side!==undefined)k.seite=choice(o.side,['links','rechts']);if(o.color!==undefined)k.farbe=color(o.color);if(o.form!==undefined)k.form=choice(o.form,forms);return k;});
 const byId=new Map(knoten.map(k=>[k.id,k]));if(byId.size!==knoten.length||knoten.filter(k=>k.eltern===null).length!==1)fail('Genau eine Wurzel, eindeutige IDs.');
 for(const k of knoten){let p=k.eltern;const seen=new Set([k.id]);while(p!==null){if(seen.has(p)||seen.size>=20)fail('Zyklus oder Tiefe.');seen.add(p);const a=byId.get(p);if(!a)return fail('Elternknoten fehlt.');p=a.eltern;}}
 const ids=new Set(byId.keys()),pairs=new Set<string>();
 const verbindungen=arr(connections,0,100).map(v=>{const o=obj(v,['id','from','to']),vid=id(o.id),von=id(o.from),zu=id(o.to),pair=[von,zu].sort().join('|');if(ids.has(vid)||!byId.has(von)||!byId.has(zu)||von===zu||pairs.has(pair))fail('Ungültige Verbindung.');ids.add(vid);pairs.add(pair);return {id:vid,von,zu};});
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
export function sheet(paper:unknown,pages:unknown=1):Obj{const n=num(pages,1,10);if(!Number.isInteger(n))fail('Ganze Seitenzahl erforderlich.');return {papier:choice(paper??'blanko',papers),blattBreite:595.28,blattHoehe:841.89*n,raumVersion:1};}

/** Patch only named objects; unrelated native fields and objects survive. */
export function editNode(value:unknown,operation:string,args:Obj):Obj{
 if(!value||typeof value!=='object'||Array.isArray(value))return fail('Mindmap fehlt.');
 const map=value as Obj;
 if(!Array.isArray(map.knoten)||!Array.isArray(map.verbindungen))return fail('Ungültige Mindmap.');
 const nodes=map.knoten as Obj[],links=map.verbindungen as Obj[];
 if(nodes.length>100||links.length>100||nodes.some(n=>!n||typeof n!=='object')||links.some(n=>!n||typeof n!=='object'))return fail('Mindmap zu gross oder ungültig.');
 const target=id(args.elementId),n=nodes.find(k=>k.id===target);
 if(!n)return fail('Knoten fehlt.');
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
