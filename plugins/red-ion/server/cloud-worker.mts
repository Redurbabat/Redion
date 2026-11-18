import {mcpStateD1,type McpDatabase} from '../../../server/mcp/state.ts';
import type {CloudDatabase} from '../../../server/mcp/repository.ts';
import {createMcpOAuth} from '../../../server/mcp/oauth.ts';
import {createMcpOAuthHttp} from '../../../server/mcp/oauth-http.ts';
import {createCloudMcpHttp} from './cloud-http.mts';
import {bedienen} from '../../../server/cloudflare.ts';

/** Das Abgleich-Tor (E795). Die Website liegt hinter Cloudflare Access, und
 * eine installierte App kommt da nicht durch. Hier, ausserhalb von Access,
 * antwortet derselbe Redion-Kern — aber NUR auf diese Wege, und jeder davon
 * verlangt ein Redion-Token, ausser dem Gerätecode (zehn Minuten, 40 Bit,
 * je Herkunft gebremst). Kein OAuth-Anbieter, keine Freigaben, keine
 * Veröffentlichung, keine Marken, keine Schnittstelle v1/mcp. */
export const SYNC_TOR=/^\/(api\/stand|konto\/(code|code-holen|ich|abmelden|geraete)|sync\/(hoch|runter)|datei\/(melden|stueck|runter|stand|weg))\/?$/;

/** Bindungen des Workers, strukturell statt aus den erzeugten Wrangler-Typen:
 * deren Globals (fetch, Response, ProcessEnv) brechen den Node-Typlauf der Tests. */
export type CloudMcpBindings={R2?:unknown;DB?:McpDatabase&CloudDatabase;MCP_ISSUER?:string;MCP_AUTHORIZATION_ENDPOINT?:string;MCP_FREE_ONLY?:string};

const unavailable=()=>new Response(JSON.stringify({error:'cloud_not_configured'}),{status:503,
  headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export default {
  async fetch(request:Request,env:CloudMcpBindings):Promise<Response>{
    if(!env.DB||!env.MCP_ISSUER||!env.MCP_AUTHORIZATION_ENDPOINT||env.MCP_FREE_ONLY!=='1')return unavailable();
    try{
      /* Die Anmeldung bleibt auf der bestehenden Access-geschützten Website.
       * Dieser Worker liefert ausschliesslich OAuth-Metadaten und Bearer-MCP. */
      const auth=new URL(env.MCP_AUTHORIZATION_ENDPOINT),issuer=new URL(env.MCP_ISSUER);
      if(auth.origin===issuer.origin)return unavailable();
      const url=new URL(request.url);if(url.origin!==issuer.origin)return new Response(null,{status:403});
      if(SYNC_TOR.test(url.pathname)||request.method==='OPTIONS'&&SYNC_TOR.test(url.pathname))
        return await bedienen(request,{DB:env.DB,R2:env.R2} as never)??new Response(null,{status:404});
      const state=mcpStateD1(env.DB),oauth=createMcpOAuth({state,issuer:env.MCP_ISSUER,resource:env.MCP_ISSUER+'/mcp',
        authorizationEndpoint:env.MCP_AUTHORIZATION_ENDPOINT});
      if(url.pathname==='/mcp')return await createCloudMcpHttp({oauth,database:env.DB})(request)??new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
      const route=createMcpOAuthHttp({oauth,state,identify:async()=>null,
        rateKey:r=>r.headers.get('CF-Connecting-IP')??'unknown-source'});
      return await route(request)??new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
    }catch{
      console.error(JSON.stringify({event:'redion_cloud_mcp_unavailable'}));
      return unavailable();
    }
  }
};
