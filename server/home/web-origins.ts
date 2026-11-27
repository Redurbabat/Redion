/** Browser clients have no access to owner/device APIs, even when configured.
 * CORS is an additional browser boundary, not authentication. */
const WEB_ROUTES=new Set(['/red-id/v2/claim-login','/red-id/v2/exchange','/red-id/v2/refresh','/red-id/v2/me','/red-id/v2/logout']);
export function parseRedWebOrigins(value:string):ReadonlySet<string>{
 const entries=value.split(',').map(s=>s.trim()).filter(Boolean);
 if(entries.length>16)throw Error('Too many RED web origins');
 for(const entry of entries){
  const url=new URL(entry);
  if(url.protocol!=='https:'||url.origin!==entry||url.username||url.password)throw Error('RED web origins must be exact HTTPS origins');
 }
 return new Set(entries);
}
export function isRedWebRoute(path:string,origin:string|null,allowed:ReadonlySet<string>){
 return !!origin&&allowed.has(origin)&&WEB_ROUTES.has(path);
}
