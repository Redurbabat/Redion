/** Bounded, grant-bound schematic undo checkpoint.
 * Internal building block only; no endpoint or database write in this module.
 * A future caller must enforce live ACL, embedding, encryption and atomic CAS
 * on the exact current record when consuming a checkpoint. Never expose the
 * checkpoint contents as a public tool argument or response.
 */
type Data=Record<string,unknown>;
export type UndoContext={workspaceId:string;documentId:string;blockId:string;userId:string;grantId:string};
type UndoCheckpoint={format:'schematic-undo-v1';context:UndoContext;version:number;
  expires:number;afterHash:string;previousPlan:Data};
const TTL=15*60*1000;
const MAX_BYTES=16384;
const bytes=(s:string)=>new TextEncoder().encode(s);
const record=(v:unknown):v is Data=>!!v&&typeof v==='object'&&!Array.isArray(v);
const contextKeys=['workspaceId','documentId','blockId','userId','grantId'] as const;
const validContext=(v:unknown):v is UndoContext=>record(v)&&
  Object.keys(v).length===contextKeys.length&&contextKeys.every(k=>
    typeof v[k]==='string'&&(v[k] as string).length>0&&(v[k] as string).length<=256);
const validVersion=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const validTime=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const validPlan=(v:unknown):v is Data=>record(v)&&Array.isArray(v.teile)&&
  Array.isArray(v.leitungen)&&Array.isArray(v.texte)&&Array.isArray(v.ebenen)&&
  v.teile.length<=120&&v.leitungen.length<=200&&v.texte.length<=120;
const parseBlock=(raw:string):Data=>{
  if(typeof raw!=='string'||bytes(raw).byteLength>50000)throw new Error('Ungültiger Schaltplanblock.');
  const block:unknown=JSON.parse(raw);
  if(!record(block)||block.type!=='schaltplan'||!validPlan(block.plan)||
    block.alive===false||block.archiviert===true||block.parentTable==='collection')
    throw new Error('Ungültiger Schaltplanblock.');
  return block;
};
const digest=async(raw:string)=>Array.from(new Uint8Array(
  await crypto.subtle.digest('SHA-256',bytes(raw))),b=>b.toString(16).padStart(2,'0')).join('');
const bounded=(v:unknown)=>bytes(JSON.stringify(v)).byteLength<=MAX_BYTES;

/** Construct from the exact stored pre/post record bytes. Call only for
 * explicitly requested undo retention, and persist atomically with the edit.
 * The caller must reject a non-fitting checkpoint rather than silently
 * promising undo. Only the old plan, not the entire block, is retained.
 */
export async function createUndoCheckpoint(context:UndoContext,previousVersion:number,
  previousRaw:string,nextRaw:string,now=Date.now()):Promise<UndoCheckpoint>{
  if(!validContext(context)||!validVersion(previousVersion)||previousVersion>=Number.MAX_SAFE_INTEGER||
    !validTime(now)||now>Number.MAX_SAFE_INTEGER-TTL)
    throw new Error('Ungültiger Wiederherstellungsauftrag.');
  const before=parseBlock(previousRaw),after=parseBlock(nextRaw);
  if(before.parentId!==after.parentId||before.parentTable!==after.parentTable)
    throw new Error('Einbettung darf beim Schaltplan-Undo nicht geändert werden.');
  if(JSON.stringify(before.plan)===JSON.stringify(after.plan))
    throw new Error('Keine Planänderung für Undo.');
  const checkpoint:UndoCheckpoint={format:'schematic-undo-v1',context:{...context},
    version:previousVersion+1,expires:now+TTL,afterHash:await digest(nextRaw),
    previousPlan:structuredClone(before.plan) as Data};
  if(!bounded(checkpoint))throw new Error('Wiederherstellungspunkt überschreitet 16 KiB.');
  return checkpoint;
}

/** Check a server-owned checkpoint against exact current version and bytes.
 * Returns a fresh candidate plan only. The caller must atomically consume
 * the checkpoint and CAS-update the block, advancing the version, never
 * decrementing it. Expiry must also be checked in the SQL transaction.
 */
export async function undoCandidate(checkpoint:unknown,context:UndoContext,
  currentVersion:number,currentRaw:string,now=Date.now()):Promise<Data>{
  if(!record(checkpoint)||checkpoint.format!=='schematic-undo-v1'||
    !validContext(checkpoint.context)||!validContext(context)||
    !validVersion(currentVersion)||!validVersion(checkpoint.version)||
    !validTime(now)||!validTime(checkpoint.expires)||
    checkpoint.expires<=now||checkpoint.expires-now>TTL||
    typeof checkpoint.afterHash!=='string'||!(/^[a-f0-9]{64}$/).test(checkpoint.afterHash)||
    !validPlan(checkpoint.previousPlan)||!bounded(checkpoint))
    throw new Error('Wiederherstellungspunkt ungültig oder abgelaufen.');
  const owner=checkpoint.context;
  if(contextKeys.some(k=>owner[k]!==context[k]))
    throw new Error('Wiederherstellungspunkt gehört nicht zu dieser Freigabe.');
  if(checkpoint.version!==currentVersion)
    throw new Error('Schaltplanversion wurde geändert.');
  parseBlock(currentRaw);
  if(await digest(currentRaw)!==checkpoint.afterHash)
    throw new Error('Schaltplaninhalt wurde geändert.');
  return structuredClone(checkpoint.previousPlan);
}
