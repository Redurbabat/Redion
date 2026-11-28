import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

export async function checkPrivateConnection(origin:string,fetcher:typeof fetch=fetch){
  const url=new URL(origin);
  if(url.protocol!=='https:'||url.origin!==origin)throw Error('Use an exact trusted HTTPS origin');
  const options:RequestInit={method:'GET',credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)};
  const stand=await fetcher(origin+'/api/stand',options);
  const dashboard=await fetcher(origin+'/home/dashboard',options);
  return {ready:stand.status===200&&dashboard.status===401,standStatus:stand.status,anonymousDashboardStatus:dashboard.status};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  checkPrivateConnection(process.env.REDION_ORIGIN??'').then(result=>{console.log(JSON.stringify(result));if(!result.ready)process.exitCode=1;}).catch(()=>{console.error('Private HTTPS check failed; inspect DNS, certificate trust, server and network.');process.exitCode=1;});
}
