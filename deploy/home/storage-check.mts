import {resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
type Block={type?:unknown;'maj:min'?:unknown;children?:unknown};
function blocks(v:unknown):Block[]{if(!Array.isArray(v))throw Error('Invalid block topology');return v.map(x=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid block node');return x as Block;});}
/** Inverse lsblk tree: match mount major/minor, require every branch
 * to terminate in a physical disk/partition underneath a crypt node.
 * Unknown devices, RAID/network/loop endpoints fail closed. */
export function cryptProtected(tree:unknown,device:string):boolean{
 if(!tree||typeof tree!=='object'||!/^\d+:\d+$/.test(device))return false;
 const roots=blocks((tree as {blockdevices?:unknown}).blockdevices);
 const matches:Block[]=[];
 const walk=(n:Block,depth:number)=>{if(depth>64)throw Error('Block topology too deep');if(n['maj:min']===device)matches.push(n);if(n.children!==undefined)for(const c of blocks(n.children))walk(c,depth+1);};
 for(const r of roots)walk(r,0);
 const protectedBranch=(n:Block,encrypted:boolean,depth:number):boolean=>{
  if(depth>64)return false;
  const seen=encrypted||n.type==='crypt';
  const children=n.children===undefined?[]:blocks(n.children);
  if(children.length===0)return seen&&['disk','part'].includes(String(n.type));
  // Reject unsupported stacks even if an apparent crypt layer exists.
  if(!['crypt','lvm','part','disk','raid0','raid1','raid5','raid6','raid10','md','mpath'].includes(String(n.type)))return false;
  return children.every(c=>protectedBranch(c,seen,depth+1));
 };
 return matches.length>0&&matches.every(n=>protectedBranch(n,false,0));
}
export function noNestedMounts(tree:unknown,root:string):boolean{
 if(!tree||typeof tree!=='object'||!Array.isArray((tree as {filesystems?:unknown}).filesystems))return false;
 const base=resolve(root),prefix=base===sep?sep:base+sep;
 for(const fs of (tree as {filesystems:unknown[]}).filesystems){
  if(!fs||typeof fs!=='object'||typeof (fs as {target?:unknown}).target!=='string')return false;
  const p=resolve((fs as {target:string}).target);
  if(p!==base&&p.startsWith(prefix))return false;
 }
 return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [mode,arg,raw]=process.argv.slice(2);
 try{
  if(!arg||!raw)throw Error('Missing topology');
  const data=JSON.parse(raw);
  if(!(mode==='device'?cryptProtected(data,arg):mode==='nested'?noNestedMounts(data,arg):false))throw Error('Encryption topology or nested mounts not verified');
 }catch{console.error('Storage preflight failed: encryption not verified. No changes performed.');process.exitCode=2;}
}
