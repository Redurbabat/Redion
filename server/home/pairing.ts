import {createHash,randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';

const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const id=()=>randomBytes(16).toString('hex');
const clock=()=>new Date().toISOString();
const normalized=(value:unknown)=>typeof value==='string'?value.trim().toUpperCase():'';
const valid=(v:string)=>/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(v);
function atomic<T>(db:DatabaseSync,operation:()=>T):T{
  db.exec('BEGIN IMMEDIATE');
  try{const result=operation();db.exec('COMMIT');return result;}
  catch(error){db.exec('ROLLBACK');throw error;}
}

/** Only invoked from the local operator CLI, never from a remote identity header. */
export function approveHomeDevice(db:DatabaseSync,input:unknown):void{
  const code=normalized(input);
  if(!valid(code))throw new Error('Invalid device code');
  atomic(db,()=>{
    const now=clock(),key=hash(code);
    const mark=db.prepare('SELECT * FROM marken WHERE wert=? AND art=?').get(key,'geraetecode');
    if(!mark||typeof mark.bis!=='string'||mark.bis<=now||mark.kontoId)throw new Error('Code missing, expired or already approved');
    const owners=db.prepare('SELECT id,gesperrt FROM konten LIMIT 2').all();
    if(owners.length>1||owners[0]?.gesperrt)throw new Error('Single-owner mode only');
    const owner=owners[0]?.id??id();
    if(!owners.length)db.prepare('INSERT INTO konten(id,name,herkunft,angelegt,gesperrt) VALUES(?,?,?,?,0)').run(owner,'RED Owner','home',now);
    const changed=db.prepare("UPDATE marken SET kontoId=?,benutzt=? WHERE wert=? AND art='geraetecode' AND kontoId='' AND bis>?").run(owner,now,key,now);
    if(changed.changes!==1)throw new Error('Device approval conflict');
  });
}

/** Consume and create a session in the same SQLite transaction, including
 * the first workspace. A repeated or concurrent claim cannot issue tokens. */
export function claimHomeDevice(db:DatabaseSync,input:unknown):{status:number;body:Record<string,unknown>}{
  const code=normalized(input);
  if(!valid(code))return {status:400,body:{error:'invalid_code'}};
  return atomic(db,()=>{
    const now=clock(),key=hash(code);
    const mark=db.prepare("SELECT * FROM marken WHERE wert=? AND art='geraetecode'").get(key);
    if(!mark)return {status:404,body:{error:'unknown_code'}};
    if(typeof mark.bis!=='string'||mark.bis<=now)return {status:410,body:{error:'expired_code'}};
    if(!mark.kontoId)return {status:202,body:{wartet:true}};
    const account=db.prepare('SELECT id,name,mail,bild,gesperrt FROM konten WHERE id=?').get(mark.kontoId);
    if(!account||typeof account.id!=='string'||account.gesperrt)return {status:403,body:{error:'account_unavailable'}};
    const removed=db.prepare("DELETE FROM marken WHERE wert=? AND art='geraetecode' AND kontoId=?").run(key,mark.kontoId);
    if(removed.changes!==1)throw new Error('Device claim conflict');
    const token='sit_'+randomBytes(32).toString('hex'),bis=new Date(Date.now()+30*86400000).toISOString();
    db.prepare('INSERT INTO sitzungen(token,kontoId,geraet,angelegt,bis) VALUES(?,?,?,?,?)').run(hash(token),account.id,String(mark.name??'Gerät').slice(0,160),now,bis);
    let areas=db.prepare('SELECT id,name FROM bereiche WHERE besitzer=?').all(account.id);
    if(!areas.length){
      db.prepare('INSERT INTO bereiche(id,name,besitzer,angelegt) VALUES(?,?,?,?)').run(id(),'Mein Bereich',account.id,now);
      areas=db.prepare('SELECT id,name FROM bereiche WHERE besitzer=?').all(account.id);
    }
    return {status:200,body:{token,bis,konto:{id:account.id,name:account.name,mail:account.mail,bild:account.bild},bereiche:areas}};
  });
}
