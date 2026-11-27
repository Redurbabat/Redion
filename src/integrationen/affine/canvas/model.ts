// Eigenständiges Modell; keine Kopie von AFFiNE oder Änderung vorhandener Dokumente.
export const tools = ['select','lasso','hand','pen','marker','eraser','line','arrow','rectangle','ellipse','circle','freeform','text','note','connector','mindmap','image'] as const;
export type Tool = typeof tools[number];
export type Point = { x: number; y: number; pressure: number };
export type Shape = { id: string; kind: Tool; points: Point[]; color: string; width: number; opacity: number; rotation: number; group: string; text: string; image: string; from: string; to: string };
export type Board = { version: 1; documentId: string; objects: Shape[] };
export type Settings = { tool: Tool; color: string; width: number; opacity: number; grid: boolean; snap: boolean; vertical: boolean; minimized: boolean; x: number; y: number };
export const defaults: Settings = {tool:'pen',color:'#64748b',width:3,opacity:1,grid:true,snap:false,vertical:false,minimized:false,x:8,y:8};
export const clone = <T>(value:T):T => JSON.parse(JSON.stringify(value)) as T;
export const bounded = (n:number,min:number,max:number):number => Math.max(min,Math.min(max,n));
export const point = (x:number,y:number,pressure=.5):Point => ({x,y,pressure});
const validNumber = (n:unknown,min:number,max:number):n is number => typeof n==='number' && Number.isFinite(n) && n>=min && n<=max;
const validColor = (s:unknown):s is string => typeof s==='string' && /^#[0-9a-f]{6}$/i.test(s);
const short = (v:unknown, max:number):v is string => typeof v==='string' && v.length<=max;
const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
export function readSettings(value:unknown):Settings {
  const s=record(value)?value:{};
  return {tool:tools.includes(s.tool as Tool)?s.tool as Tool:defaults.tool,color:validColor(s.color)?s.color:defaults.color,
    width:validNumber(s.width,1,80)?s.width:defaults.width,opacity:validNumber(s.opacity,.05,1)?s.opacity:1,
    grid:typeof s.grid==='boolean'?s.grid:true,snap:s.snap===true,vertical:s.vertical===true,minimized:s.minimized===true,
    x:validNumber(s.x,0,10000)?s.x:8,y:validNumber(s.y,0,10000)?s.y:8};
}
const allowedImage = (v:unknown):v is string => typeof v==='string' && v.length<=2_000_000 && (v==='' || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v));
export function parseBoard(value:unknown, documentId:string):Board {
  if (!record(value)||value.version!==1||value.documentId!==documentId||!Array.isArray(value.objects)||value.objects.length>2000) throw Error('Ungültiges Whiteboard');
  const ids=new Set<string>(); let total=0, bytes=0;
  const objects=value.objects.map((v:unknown):Shape=>{
    if (!record(v)||!short(v.id,100)||!v.id||ids.has(v.id)||!tools.includes(v.kind as Tool)||
      ['select','lasso','hand','eraser'].includes(v.kind as string)||!Array.isArray(v.points)||v.points.length<1||v.points.length>10000||
      !validColor(v.color)||!validNumber(v.width,1,80)||!validNumber(v.opacity,.05,1)||!validNumber(v.rotation,-360,360)||
      !short(v.group,100)||!short(v.text,10000)||!allowedImage(v.image)||!short(v.from,100)||!short(v.to,100)) throw Error('Ungültiges Zeichenobjekt');
    total+=v.points.length; bytes+=v.image.length+v.text.length;
    if(total>100000||bytes>8_000_000) throw Error('Whiteboard zu gross');
    const points=v.points.map((p:unknown):Point=>{
      if(!record(p)||!validNumber(p.x,-1e7,1e7)||!validNumber(p.y,-1e7,1e7)||!validNumber(p.pressure,0,1))throw Error('Ungültiger Punkt');
      return {x:p.x,y:p.y,pressure:p.pressure};
    });
    ids.add(v.id);return {id:v.id,kind:v.kind as Tool,points,color:v.color,width:v.width,opacity:v.opacity,rotation:v.rotation,group:v.group,text:v.text,image:v.image,from:v.from,to:v.to};
  });
  for(const o of objects) if(o.from && (!ids.has(o.from)||o.from===o.id)||o.to&&(!ids.has(o.to)||o.to===o.id))throw Error('Ungültige Verbindung');
  return {version:1,documentId,objects};
}
export const bounds = (o:Shape) => {
  let x=Infinity,y=Infinity,r=-Infinity,b=-Infinity;
  for(const p of o.points){x=Math.min(x,p.x);y=Math.min(y,p.y);r=Math.max(r,p.x);b=Math.max(b,p.y);}
  return {x,y,w:Math.max(1,r-x),h:Math.max(1,b-y)};
};
export const center = (o:Shape):Point => {const b=bounds(o);return point(b.x+b.w/2,b.y+b.h/2);};
export const distanceToSegment = (p:Point,a:Point,b:Point):number=>{
  const dx=b.x-a.x,dy=b.y-a.y;const t=bounded(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
};
export const hit = (o:Shape,p:Point,tolerance:number):boolean=>{
  const c=center(o),a=-o.rotation*Math.PI/180,dx=p.x-c.x,dy=p.y-c.y;
  const q=point(c.x+dx*Math.cos(a)-dy*Math.sin(a),c.y+dx*Math.sin(a)+dy*Math.cos(a));
  if(['pen','marker','line','arrow','connector','freeform'].includes(o.kind)){
    return o.points.some((v,i)=>distanceToSegment(q,o.points[i-1]??v,v)<=tolerance+o.width/2);
  }
  const b=bounds(o);return q.x>=b.x-tolerance&&q.x<=b.x+b.w+tolerance&&q.y>=b.y-tolerance&&q.y<=b.y+b.h+tolerance;
};
export const inside = (p:Point, polygon:Point[]):boolean=>{
  let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];if(a&&b&&(a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
  }return yes;
};
export class BoardModel {
  private current:Board;
  private past:Board[]=[];
  private future:Board[]=[];
  readonly documentId:string;
  constructor(documentId:string, initial?:unknown){this.documentId=documentId;this.current=initial===undefined?{version:1,documentId,objects:[]}:parseBoard(initial,documentId);}
  serialize():Board{return clone(this.current);}
  replace(objects:Shape[]):boolean{
    const next=parseBoard({version:1,documentId:this.documentId,objects},this.documentId);
    if(JSON.stringify(next)===JSON.stringify(this.current))return false;
    this.past.push(this.current);if(this.past.length>20)this.past.shift();this.future=[];this.current=next;return true;
  }
  undo():boolean{const prev=this.past.pop();if(!prev)return false;this.future.push(this.current);this.current=prev;return true;}
  redo():boolean{const next=this.future.pop();if(!next)return false;this.past.push(this.current);this.current=next;return true;}
  import(value:unknown):boolean{return this.replace(parseBoard(value,this.documentId).objects);}
}
export const createShape = (id:string,kind:Tool,points:Point[],settings:Settings):Shape=>({id,kind,points:clone(points),color:settings.color,width:settings.width,opacity:kind==='marker'?Math.min(settings.opacity,.35):settings.opacity,rotation:0,group:'',text:'',image:'',from:'',to:''});
export function without(objects:Shape[],ids:Set<string>):Shape[]{
  return objects.filter(o=>!ids.has(o.id)).map(o=>({...o,from:ids.has(o.from)?'':o.from,to:ids.has(o.to)?'':o.to}));
}
export function moveObjects(objects:Shape[],ids:Set<string>,dx:number,dy:number):Shape[]{
  return objects.map(o=>ids.has(o.id)?{...o,points:o.points.map(p=>({...p,x:p.x+dx,y:p.y+dy}))}:o);
}
export function expandGroups(objects:Shape[],ids:Set<string>):Set<string>{
  const groups=new Set(objects.filter(o=>ids.has(o.id)&&o.group).map(o=>o.group));
  return new Set(objects.filter(o=>ids.has(o.id)||groups.has(o.group)).map(o=>o.id));
}
export const worldPoint=(p:Point,view:{x:number;y:number;zoom:number}):Point=>point((p.x-view.x)/view.zoom,(p.y-view.y)/view.zoom,p.pressure);
export const zoomAt=(p:Point,view:{x:number;y:number;zoom:number},factor:number)=>{
  const w=worldPoint(p,view),zoom=bounded(view.zoom*factor,.1,8);return {x:p.x-w.x*zoom,y:p.y-w.y*zoom,zoom};
};
