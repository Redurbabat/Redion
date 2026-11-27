import http from 'node:http';
import {Readable} from 'node:stream';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openHomeDatabase} from './home/sqlite.ts';
import {openHomeBlobs} from './home/blobs.ts';
import {beantworte} from './kern.ts';
import {approveHomeDevice,claimHomeDevice} from './home/pairing.ts';
import {prepareHomeConsent,issueHomeConsentCode,identifyHomeConsent,homeConsentLogin,exchangeHomeConsent,logoutHomeConsent} from './home/consent.ts';
import {handleCloudMcp,isCloudMcpPublicPath,isCloudMcpPrivatePath} from './mcp/cloud-router.ts';
import {alsAnfrage,alsAntwort} from './cloudflare.ts';
import {zuGrossAntwort} from './sicherheit/eingaben.ts';
import {istAbgleichWeg,mitAppUrsprung} from './sicherheit/abgleich-tor.ts';

const privateRoutes=new Set(['/api/stand','/konto/geraete']);
const json=(status:number,error:string)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});

/** Initial private API: no static repository files, public registration,
 * public pages, or unverified Cloudflare identity headers. */
export async function openHomeServer(options:{dataDir:string;origin:string;enableMcp?:boolean}){
  const origin=new URL(options.origin);
  if(origin.protocol!=='https:'||origin.origin!==options.origin)throw new Error('REDION_ORIGIN must be an HTTPS origin');
  const store=openHomeDatabase(join(options.dataDir,'redion.sqlite'));
  const blobs=await openHomeBlobs(join(options.dataDir,'blobs')).catch(error=>{store.close();throw error;});
  if(options.enableMcp)prepareHomeConsent(store.sqlite);
  let queue:Promise<unknown>=Promise.resolve();
  function serial<T>(execute:()=>Promise<T>):Promise<T>{
    const result=queue.then(execute);
    queue=result.catch(()=>undefined);
    return result;
  }
  async function handle(request:Request):Promise<Response>{
    const path=new URL(request.url).pathname;
    if(new URL(request.url).origin!==origin.origin)return json(400,'invalid_host');
    const mcpRoute=isCloudMcpPublicPath(path)||isCloudMcpPrivatePath(path)||['/home/mcp-login','/home/mcp-logout'].includes(path);
    if(mcpRoute&&!options.enableMcp)return json(404,'not_found');
    if(!mcpRoute&&!istAbgleichWeg(path)&&!privateRoutes.has(path))return json(404,'not_found');
    const clientOrigin=request.headers.get('origin');
    if(clientOrigin&&clientOrigin!==origin.origin&&!(istAbgleichWeg(path)&&['redion-local://app','capacitor://localhost'].includes(clientOrigin)))return json(403,'invalid_origin');
    if(request.method==='OPTIONS'&&!istAbgleichWeg(path))return json(405,'method_not_allowed');
    if(mcpRoute){
      return serial(async()=>{
        if(path==='/home/mcp-login')return exchangeHomeConsent(store.sqlite,request,origin.origin);
        if(path==='/home/mcp-logout')return logoutHomeConsent(store.sqlite,request,origin.origin);
        const identify=async(req:Request)=>identifyHomeConsent(store.sqlite,req);
        if(isCloudMcpPrivatePath(path)&&!await identify(request)){
          if(request.method!=='GET')return json(401,'consent_login_required');
          return homeConsentLogin(path+new URL(request.url).search,origin.origin);
        }
        return handleCloudMcp(request,{DB:store.db},false,identify);
      });
    }
    const parsed=await alsAnfrage(request);
    if('zuGross' in parsed)return alsAntwort(zuGrossAntwort(parsed.zuGross));
    const execute=async()=>{
      if(path==='/konto/code-holen'&&request.method==='POST'){
        const result=claimHomeDevice(store.sqlite,parsed.koerper?.code);
        return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
      }
      return alsAntwort(await beantworte(parsed,store.ablage,{ADRESSE:origin.origin,blobs}));
    };
    const response=await serial(execute);
    if(clientOrigin===origin.origin&&istAbgleichWeg(path)){
      response.headers.set('Access-Control-Allow-Origin',origin.origin);
      response.headers.append('Vary','Origin');
    }
    return istAbgleichWeg(path)?mitAppUrsprung(request,response):response;
  }
  return {handle,store,blobs,close:()=>store.close()};
}

async function main(){
  process.umask(0o077);
  const dataDir=resolve(process.env.REDION_DATA_DIR||'redion-home-data');
  const origin=process.env.REDION_ORIGIN;
  if(!origin)throw new Error('Set REDION_ORIGIN first');
  const enableMcp=process.env.REDION_ENABLE_MCP==='1';
  const service=await openHomeServer({dataDir,origin,enableMcp});
  const command=process.argv[2];
  if(command==='mcp-login-code'){
    try{
      if(!enableMcp)throw new Error('Set REDION_ENABLE_MCP=1 first');
      console.log(issueHomeConsentCode(service.store.sqlite));
    } finally {service.close();}
    return;
  }
  if(command==='approve-device'){
    try{
      approveHomeDevice(service.store.sqlite,process.argv[3]);
      console.log('Device approved locally. Return to the RED ION client.');
    } finally {service.close();}
    return;
  }
  if(command&&command!=='serve'){service.close();throw new Error('Unknown command');}
  const port=Number(process.env.PORT||8790);
  const server=http.createServer(async(req,res)=>{
    try {
      // The listener is private; the proxy must replace forwarded headers.
      const headers=new Headers();
      for(const [key,value] of Object.entries(req.headers)){
        if(value===undefined||/^(cf-|x-forwarded-|forwarded$)/i.test(key))continue;
        headers.set(key,Array.isArray(value)?value.join(', '):value);
      }
      headers.set('cf-connecting-ip',req.socket.remoteAddress||'local');
      const method=req.method||'GET';
      const path=req.url||'/';
      if(!path.startsWith('/')||path.startsWith('//')){res.writeHead(400);res.end();return;}
      const init:RequestInit & {duplex?:'half'}={method,headers};
      if(method!=='GET'&&method!=='HEAD'){init.body=Readable.toWeb(req) as unknown as ReadableStream<Uint8Array>;init.duplex='half';}
      const response=await service.handle(new Request(origin+path,init));
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"internal_error"}');}
  });
  server.requestTimeout=30000;
  server.headersTimeout=10000;
  server.listen(port,process.env.REDION_BIND||'127.0.0.1',()=>console.log('RED ION private API listening on port '+port));
  const stop=()=>server.close(()=>service.close());
  process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error instanceof Error?error.message:'Startup failed');process.exitCode=1;});
