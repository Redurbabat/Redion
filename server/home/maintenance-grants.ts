import type {DatabaseSync} from 'node:sqlite';
const WINDOW=86_400_000;
/** Count only owner-scoped, unexpired grants and credentials. Read-only. */
export function reviewRedGrants(db:DatabaseSync,owner:string,now:number){
 if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(now+WINDOW))throw new RangeError('Invalid grant review time');
 const until=now+WINDOW;
 const counts=(sql:string)=>{
  const row=db.prepare(sql).get(until,owner,now);
  return {active:Number(row?.active??0),expiringSoon:Number(row?.soon??0)};
 };
 const store=counts('SELECT COUNT(*) AS active,COALESCE(SUM(expires<=?),0) AS soon FROM home_red_store_grant WHERE owner=? AND expires>?');
 const share=counts('SELECT COUNT(*) AS active,COALESCE(SUM(expires<=?),0) AS soon FROM home_red_share_grant WHERE owner=? AND expires>?');
 const legacy=counts('SELECT COUNT(*) AS active,COALESCE(SUM(expires<=?),0) AS soon FROM home_red_id WHERE owner=? AND expires>?');
 const sessions=counts('SELECT COUNT(*) AS active,COALESCE(SUM(refresh_until<=?),0) AS soon FROM home_red_session WHERE owner=? AND refresh_until>?');
 const credentials={active:legacy.active+sessions.active,expiringSoon:legacy.expiringSoon+sessions.expiringSoon};
 return {version:1,asOf:now,windowMs:WINDOW,status:store.expiringSoon+share.expiringSoon+credentials.expiringSoon>0?'warning':'ok',store,share,credentials};
}
