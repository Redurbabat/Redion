/* Cloud-Abgleich für die Windows-App (E795).
 *
 * Drei Zusagen, jede mit einer Gegenprobe, die rot werden KANN (§55.2):
 *  1. /konto/access gibt eine Redion-Sitzung nur einem von Access geprüften
 *     Menschen, nur per POST vom eigenen Ursprung — und für DASSELBE Konto
 *     und denselben Bereich, den die Cloud-MCP-Anmeldung benutzt.
 *  2. Der öffentliche Worker red-ion-mcp lässt vom Redion-Kern NUR die
 *     Abgleichwege durch; Anmeldung über Anbieter, Freigaben, Marken,
 *     Veröffentlichen und v1/mcp bleiben draussen.
 *  3. Der Deckel: mehr als 5 GB Anhänge nimmt der Server nicht an; eine
 *     erneuerte Datei zählt nicht doppelt.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudFixture} from './helfer/mcp-cloud.mts';
import {cloudDatabase} from './helfer/mcp-cloud-database.mts';
import {cloudUserFromAccess,createAccessSession} from '../server/mcp/account.ts';
import {schluesselVergessen} from '../server/sicherheit/tor.ts';
import {beantworte,sitzungFuerKonto} from '../server/kern.ts';
import {ablageD1,blobsSpeicher} from '../server/ablage.ts';
import {WOLKE_ANTEIL} from '../server/dateien.ts';
import path from 'node:path';
import {build} from 'rolldown';

/* Wie plugins/red-ion/tests/cloud.mts: der Worker zieht den Werkzeugkatalog aus
   einer .cts-Datei, die Node nicht als ESM laden kann — also wird gebündelt. */
const output=path.resolve(import.meta.dirname,'../build/cloud-worker-sync-test.mjs');
await build({input:path.resolve(import.meta.dirname,'../plugins/red-ion/server/cloud-worker.mts'),platform:'neutral',resolve:{mainFields:['module','main']},output:{file:output,format:'esm',codeSplitting:false}});
const mod=await import(new URL('file:///'+output.replace(/\\/g,'/')).href) as {default:{fetch(r:Request,e:unknown):Promise<Response>},SYNC_TOR:RegExp};
const worker=mod.default,SYNC_TOR=mod.SYNC_TOR;

const env={ACCESS_TEAM:'synthetic.cloudflareaccess.com',ACCESS_AUD:'synthetic-redion'};
const SITE='https://app.example.test';
const b64=(value:unknown)=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
const fixture=async()=>{
  const f=cloudFixture(),db=cloudDatabase(f.sqlite);
  const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
  const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey);
  const fetchKeys:typeof fetch=async()=>new Response(JSON.stringify({keys:[{...publicKey,kid:'synthetic-key'}]}),{headers:{'Content-Type':'application/json'}});
  const signed=async(patch:Record<string,unknown>={})=>{
    const data=b64({alg:'RS256',kid:'synthetic-key'})+'.'+b64({iss:'https://synthetic.cloudflareaccess.com',sub:'first-user',email:'synthetic@example.invalid',type:'app',
      aud:[env.ACCESS_AUD],exp:Math.floor(f.now()/1000)+3600,...patch});
    const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(data));
    return data+'.'+Buffer.from(signature).toString('base64url');
  };
  schluesselVergessen();
  const session=createAccessSession({database:db.database,env,now:f.now,fetchKeys});
  return {...f,...db,fetchKeys,signed,session};
};
const post=(headers:Record<string,string>,method='POST')=>new Request(SITE+'/konto/access',{method,headers,...(method==='POST'?{body:'{}'}:{})});

test('/konto/access: Sitzung nur für einen Access-geprüften Menschen, nur per POST vom eigenen Ursprung',async()=>{
  const f=await fixture();try{
    const jwt=await f.signed();
    assert.equal((await f.session(post({'Cf-Access-Jwt-Assertion':jwt,Origin:SITE},'GET'))).status,405,'GET darf keine Sitzung geben');
    assert.equal((await f.session(post({'Cf-Access-Jwt-Assertion':jwt}))).status,403,'ohne Origin keine Sitzung');
    assert.equal((await f.session(post({'Cf-Access-Jwt-Assertion':jwt,Origin:'https://evil.test'}))).status,403,'fremder Ursprung');
    assert.equal((await f.session(post({Origin:SITE}))).status,401,'ohne Access-Nachweis');
    assert.equal((await f.session(post({'Cf-Access-Jwt-Assertion':await f.signed({aud:['fremd']}),Origin:SITE}))).status,401,'fremde Audience');
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM sitzungen').get()!.n,0,'keine Abweisung legt eine Sitzung an');

    const ok=await f.session(post({'Cf-Access-Jwt-Assertion':jwt,Origin:SITE}));
    assert.equal(ok.status,200);assert.equal(ok.headers.get('Cache-Control'),'no-store');
    const body=await ok.json() as {token:string};assert.match(body.token,/^sit_/);

    /* Dasselbe Konto und derselbe Bereich wie die MCP-Anmeldung. */
    const mcpUser=await cloudUserFromAccess(new Request(SITE+'/mcp/authorize',{headers:{'Cf-Access-Jwt-Assertion':jwt}}),f.database,env,{now:f.now,fetchKeys:f.fetchKeys});
    assert.ok(mcpUser);
    const ich=await beantworte({methode:'GET',pfad:'/konto/ich',kopf:{authorization:'Bearer '+body.token}},ablageD1(f.database),{});
    assert.equal(ich.status,200);
    const daten=JSON.parse(ich.koerper) as {konto:{id:string};bereiche:{id:string}[]};
    assert.equal(daten.konto.id,mcpUser.id,'Abgleich-Konto = MCP-Konto');
    assert.deepEqual(daten.bereiche.map(b=>b.id),mcpUser.workspaces.map(w=>w.id),'kein zweiter Bereich neben dem MCP-Bereich');
  }finally{f.close();schluesselVergessen();}
});

test('Abgleich-Tor im öffentlichen Worker: nur die Abgleichwege des Kerns',async()=>{
  for(const p of ['/api/stand','/konto/code','/konto/code-holen','/konto/ich','/konto/abmelden','/konto/geraete','/sync/hoch','/sync/runter',
    '/datei/melden','/datei/stueck','/datei/runter','/datei/stand','/datei/weg'])assert.ok(SYNC_TOR.test(p),'muss durch: '+p);
  for(const p of ['/konto/oauth/github','/konto/oauth/github/zurueck','/konto/code-freigeben','/konto/loeschen','/konto/access','/v1/pages','/mcp',
    '/marken','/freigabe','/veroeffentlichen','/bereich','/s/abc','/sync/hoch/../../marken','/sync','/datei','/protokoll','/push/abo'])
    assert.ok(!SYNC_TOR.test(p),'muss draussen bleiben: '+p);

  const f=await fixture();try{
    const wenv={DB:f.database,MCP_ISSUER:'https://mcp.example.test',MCP_AUTHORIZATION_ENDPOINT:SITE+'/mcp/authorize',MCP_FREE_ONLY:'1'};
    const call=(pfad:string,init:RequestInit={})=>worker.fetch(new Request('https://mcp.example.test'+pfad,init),wenv);
    const stand=await call('/api/stand');assert.equal(stand.status,200);assert.equal((await stand.json() as {ablage:string}).ablage,'d1');
    assert.equal((await call('/sync/runter',{method:'POST',body:'{}',headers:{'Content-Type':'application/json'}})).status,401,'Abgleich ohne Token');
    const code=await call('/konto/code',{method:'POST',body:JSON.stringify({geraet:'Prüfgerät'}),headers:{'Content-Type':'application/json'}});
    assert.equal(code.status,200);const c=(await code.json() as {code:string}).code;
    assert.equal((await call('/konto/code-holen',{method:'POST',body:JSON.stringify({code:c}),headers:{'Content-Type':'application/json'}})).status,202,'Code wartet auf Freigabe');
    /* Die Windows-App fragt von redion-local://app (P: am 18.11. „Server nicht
       erreichbar“, weil die Antwort kein Allow-Origin trug). Genau dieser
       Ursprung bekommt ihn, ein fremder nicht, und nie ein Stern. */
    const vorab=(origin:string)=>call('/konto/code',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST',
      'Access-Control-Request-Headers':'content-type,redion-geraet'}});
    assert.equal((await vorab('redion-local://app')).headers.get('Access-Control-Allow-Origin'),'redion-local://app','App-Vorabfrage');
    const appPost=await call('/konto/code',{method:'POST',body:'{}',headers:{'Content-Type':'application/json',Origin:'redion-local://app'}});
    assert.equal(appPost.headers.get('Access-Control-Allow-Origin'),'redion-local://app','App-Antwort lesbar');
    for(const fremd of ['https://evil.test','null','redion-local://evil'])
      assert.notEqual((await vorab(fremd)).headers.get('Access-Control-Allow-Origin'),fremd,'kein Allow-Origin für '+fremd);
    assert.notEqual((await vorab('https://evil.test')).headers.get('Access-Control-Allow-Origin'),'*','nie ein Stern');
    /* Draussen: der Kern bekommt diese Wege gar nicht zu sehen. */
    for(const p of ['/konto/oauth/github','/v1/users/me','/marken','/konto/code-freigeben'])
      assert.equal((await call(p,{method:'POST',body:'{}'})).status,404,'nicht über das Tor: '+p);
  }finally{f.close();schluesselVergessen();}
});

test('Gerätecode über das Tor: die Website gibt frei, die App bekommt eine Sitzung desselben Kontos',async()=>{
  const f=await fixture();try{
    const wenv={DB:f.database,MCP_ISSUER:'https://mcp.example.test',MCP_AUTHORIZATION_ENDPOINT:SITE+'/mcp/authorize',MCP_FREE_ONLY:'1'};
    const call=(pfad:string,body:unknown,kopf:Record<string,string>={})=>worker.fetch(new Request('https://mcp.example.test'+pfad,
      {method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json',...kopf}}),wenv);
    const web=await (await f.session(post({'Cf-Access-Jwt-Assertion':await f.signed(),Origin:SITE}))).json() as {token:string;konto:{id:string}};
    const c=(await (await call('/konto/code',{geraet:'Windows'})).json() as {code:string}).code;
    const frei=await beantworte({methode:'POST',pfad:'/konto/code-freigeben',kopf:{authorization:'Bearer '+web.token},koerper:{code:c}},ablageD1(f.database),{});
    assert.equal(frei.status,200);
    const app=await call('/konto/code-holen',{code:c});assert.equal(app.status,200);
    const appToken=(await app.json() as {token:string}).token;
    const ich=await call('/konto/ich',{}, {Authorization:'Bearer '+appToken});
    /* /konto/ich ist GET im Kern; über POST antwortet er nicht mit dem Konto — also GET: */
    const ichGet=await worker.fetch(new Request('https://mcp.example.test/konto/ich',{headers:{Authorization:'Bearer '+appToken}}),wenv);
    assert.equal(ichGet.status,200,'App-Sitzung gilt am Tor (POST gab '+ich.status+')');
    assert.equal((await ichGet.json() as {konto:{id:string}}).konto.id,web.konto.id,'App und Website = ein Konto');
  }finally{f.close();schluesselVergessen();}
});

test('Deckel: über 5 GB Anhänge nimmt der Server nicht an, eine erneuerte Datei zählt nicht doppelt',async()=>{
  const f=await fixture();try{
    const ablage=ablageD1(f.database),umwelt={blobs:blobsSpeicher()};
    f.sqlite.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').run('k1');
    f.sqlite.prepare('INSERT INTO bereiche(id,name,besitzer) VALUES(?,?,?)').run('b1','Prüfbereich','k1');
    const sitz=JSON.parse((await sitzungFuerKonto(ablage,'k1','Prüfgerät')).koerper) as {token:string};
    const melden=(id:string,groesse:number)=>beantworte({methode:'POST',pfad:'/datei/melden',kopf:{authorization:'Bearer '+sitz.token},
      koerper:{bereich:'b1',datei:{id,name:id+'.pdf',groesse,typ:'application/pdf',seite:'s1',teile:1}}},ablage,umwelt);
    /* Fast voll: ein fremder Bestand von Anteil − 10 MB, gelöscht gezählt nicht. */
    const MB=1024*1024;
    f.sqlite.prepare("INSERT INTO dateien(id,bereich,name,groesse,typ,seite,teile,verschluesselt,version,geaendert,geloescht) VALUES('alt','b1','alt',?,'x','s1',1,0,1,'2026',0)").run(WOLKE_ANTEIL-10*MB);
    f.sqlite.prepare("INSERT INTO dateien(id,bereich,name,groesse,typ,seite,teile,verschluesselt,version,geaendert,geloescht) VALUES('weg','b1','weg',?,'x','s1',1,0,1,'2026',1)").run(50*MB);
    assert.equal((await melden('klein',8*MB)).status,200,'unter dem Deckel');
    const voll=await melden('gross',5*MB);assert.equal(voll.status,507,'über dem Deckel');
    assert.match(JSON.parse(voll.koerper).message,/bleibt auf dem Gerät/);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM dateien WHERE id='gross'").get()!.n,0,'abgewiesene Datei nicht angelegt');
    assert.equal((await melden('klein',9*MB)).status,200,'erneuerte Datei zählt ihren alten Stand nicht doppelt');
  }finally{f.close();schluesselVergessen();}
});
