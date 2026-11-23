/* Das Abgleich-Tor der installierten App im echten worker.ts (E795, PR #213).
 *
 *  1. Nur die exakten Abgleichwege kommen ohne Access-Nachweis am Worker-Tor
 *     vorbei — und landen dann beim Redion-Kern, der Tokens verlangt.
 *     Alles andere (Code-Freigabe, Anbieter-Anmeldung, Freigaben, Marken,
 *     /bereich, Website) bleibt beim Tor (403).
 *  2. Nur der exakte App-Ursprung redion-local://app bekommt Allow-Origin.
 *  3. POST /konto/access gibt einer von Access geprüften Person eine Sitzung —
 *     für das Konto mit derselben E-Mail, das auch /mcp/cloud benutzt.
 *  4. Der ganze Weg der App: Code holen (ohne Access) → auf der Website
 *     freigeben (mit Access) → Token abholen → hochladen → Satz in der D1.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {SCHEMA,ablageD1} from '../server/ablage.ts';
import {schluesselVergessen} from '../server/sicherheit/tor.ts';
import {istAbgleichWeg} from '../server/sicherheit/abgleich-tor.ts';
import path from 'node:path';
import {build} from 'rolldown';

/* worker.ts liegt im Wurzelordner und wird dort als CommonJS geladen —
   wie im Laufzeittest wird er gebündelt (Ausgabe im ignorierten bilder/). */
const ausgabe=path.resolve('bilder/redion-mcp/cloud/abgleich-tor-worker.mjs');
fs.mkdirSync(path.dirname(ausgabe),{recursive:true});
await build({input:path.resolve('worker.ts'),platform:'neutral',output:{file:ausgabe,format:'esm',codeSplitting:false}});
const worker=(await import(new URL('file:///'+ausgabe.replace(/\\/g,'/')).href)).default as {fetch(r:Request,e:unknown,c:unknown):Promise<Response>};

const SITE='https://redion.example.test', APP='redion-local://app', IOS='capacitor://localhost';
const TEAM='example.cloudflareaccess.com', AUD='test-audience';
const b64=(v:unknown)=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');

const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
/* torPruefen holt die Schlüssel über das globale fetch — nur diese eine Adresse wird beantwortet. */
const echtesFetch=globalThis.fetch;
globalThis.fetch=(async(input:any)=>{
  const url=String(input instanceof Request?input.url:input);
  if(url===`https://${TEAM}/cdn-cgi/access/certs`)
    return new Response(JSON.stringify({keys:[{...jwk,kid:'k1'}]}),{headers:{'Content-Type':'application/json'}});
  throw new Error('Unerwarteter Netzaufruf: '+url);
}) as typeof fetch;
test.after(()=>{globalThis.fetch=echtesFetch;});

const nachweis=async(mail='owner@example.test')=>{
  const daten=b64({alg:'RS256',kid:'k1'})+'.'+b64({iss:`https://${TEAM}`,aud:[AUD],sub:'u1',email:mail,type:'app',
    exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000)});
  const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(daten));
  return daten+'.'+Buffer.from(sig).toString('base64url');
};

const fixture=async()=>{
  schluesselVergessen();
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(SCHEMA);
  sqlite.exec(fs.readFileSync(new URL('../server/mcp/schema.sql',import.meta.url),'utf8'));
  const db={prepare(sql:string){
    let values:(string|number)[]=[];
    const params=()=>Object.fromEntries(values.map((v,i)=>['?'+(i+1),v]));
    const bound=():any[]=>sql.includes('?1')?[params()]:values;
    return {bind(...next:(string|number)[]){values=next;return this;},
      async first<T>(){return (sqlite.prepare(sql).get(...bound()) as T|undefined)??null;},
      async all<T>(){return {results:sqlite.prepare(sql).all(...bound()) as T[]};},
      async run(){return sqlite.prepare(sql).run(...bound());}};
  }};
  const store=ablageD1(db);
  await store.setze('konten',{id:'cf_owner',mail:'owner@example.test',name:'owner',herkunft:'cloudflare-access',angelegt:'',gesperrt:0});
  await store.setze('bereiche',{id:'ws_owner',name:'Mein Redion',besitzer:'cf_owner',angelegt:''});
  const env={DB:db,ACCESS_AUD:AUD,ACCESS_TEAM:TEAM,ABGLEICH_TOR:'an',ASSETS:{fetch:async()=>new Response('WEBSITE',{status:200})}};
  const rufe=(pfad:string,init:RequestInit={})=>worker.fetch(new Request(SITE+pfad,init),env,{});
  return {sqlite,store,env,rufe,close:()=>sqlite.close()};
};
const json=(k:Record<string,string>={})=>({'Content-Type':'application/json',...k});

test('Nur exakte Abgleichwege sind ohne Access erreichbar',async()=>{
  for(const p of ['/konto/code','/konto/code-holen','/konto/ich','/konto/abmelden','/sync/hoch','/sync/runter',
    '/datei/melden','/datei/stueck','/datei/runter','/datei/stand','/datei/weg'])assert.ok(istAbgleichWeg(p),p);
  for(const p of ['/konto/code-freigeben','/konto/oauth/github','/konto/loeschen','/konto/access','/konto/geraete',
    '/sync','/sync/hoch/','/sync/hoch/x','/bereich','/marken','/freigabe','/v1/users/me','/mcp','/s/x','/','/index.html'])
    assert.ok(!istAbgleichWeg(p),'darf nicht: '+p);
  const f=await fixture();try{
    const r=await f.rufe('/sync/runter',{method:'POST',headers:json(),body:'{}'});
    assert.equal(r.status,401,'Abgleich ohne Token: Kern sagt 401, nicht das Tor');
    for(const p of ['/konto/code-freigeben','/konto/oauth/github','/bereich','/marken','/index.html','/konto/access']){
      const a=await f.rufe(p,{method:'POST',headers:json(),body:'{}'});
      assert.equal(a.status,403,'ohne Access gesperrt: '+p);
    }
  }finally{f.close();}
});

test('Ohne den Schalter ABGLEICH_TOR bleibt jeder Abgleichweg hinter Access (Standard)',async()=>{
  const f=await fixture();try{
    const aus={...f.env,ABGLEICH_TOR:undefined};
    for(const p of ['/sync/runter','/sync/hoch','/konto/code','/konto/ich','/datei/stand']){
      const r=await worker.fetch(new Request(SITE+p,{method:'POST',headers:json({Origin:APP}),body:'{}'}),aus,{});
      assert.equal(r.status,403,'ohne Schalter gesperrt: '+p);
      assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
    }
  }finally{f.close();}
});

test('Allow-Origin nur für den exakten App-Ursprung, Vorabfrage ohne Körper',async()=>{
  const f=await fixture();try{
    const vorab=(origin:string)=>f.rufe('/konto/code',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}});
    for(const origin of [APP,IOS]){
      const ok=await vorab(origin);
      assert.equal(ok.status,204);
      assert.equal(ok.headers.get('Access-Control-Allow-Origin'),origin);
    }
    for(const fremd of ['https://evil.test','null','redion-local://evil',
      'capacitor://evil','capacitor://localhost.evil.test','ionic://localhost'])
      assert.notEqual((await vorab(fremd)).headers.get('Access-Control-Allow-Origin'),fremd,fremd);
    const post=await f.rufe('/konto/code',{method:'POST',headers:json({Origin:APP}),body:JSON.stringify({geraet:'Windows'})});
    assert.equal(post.status,200);assert.equal(post.headers.get('Access-Control-Allow-Origin'),APP);
    const ios=await f.rufe('/konto/code',{method:'POST',
      headers:json({Origin:IOS}),body:JSON.stringify({geraet:'iPhone'})});
    assert.equal(ios.status,200);assert.equal(ios.headers.get('Access-Control-Allow-Origin'),IOS);
  }finally{f.close();}
});

test('/konto/access: Sitzung nur mit Access-Nachweis, POST, eigenem Ursprung und eindeutigem Konto',async()=>{
  const f=await fixture();try{
    const jwt=await nachweis();
    const mit=(k:Record<string,string>)=>({...json(k),'Cf-Access-Jwt-Assertion':jwt});
    assert.equal((await f.rufe('/konto/access',{method:'GET',headers:mit({Origin:SITE})})).status,405);
    assert.equal((await f.rufe('/konto/access',{method:'POST',headers:mit({}),body:'{}'})).status,403,'ohne Origin');
    assert.equal((await f.rufe('/konto/access',{method:'POST',headers:mit({Origin:'https://evil.test'}),body:'{}'})).status,403);
    const fremd=await nachweis('niemand@example.test');
    assert.equal((await f.rufe('/konto/access',{method:'POST',headers:{...json({Origin:SITE}),'Cf-Access-Jwt-Assertion':fremd},body:'{}'})).status,403,'kein Konto');
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM sitzungen').get()!.n,0,'keine Abweisung legt eine Sitzung an');
    const r=await f.rufe('/konto/access',{method:'POST',headers:mit({Origin:SITE}),body:'{}'});
    assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');
    const {token}=await r.json() as {token:string};
    const ich=await f.rufe('/konto/ich',{headers:{Authorization:'Bearer '+token}});
    assert.equal(ich.status,200);
    const d=await ich.json() as {konto:{id:string};bereiche:{id:string}[]};
    assert.equal(d.konto.id,'cf_owner','dasselbe Konto wie /mcp/cloud');
    assert.deepEqual(d.bereiche.map(b=>b.id),['ws_owner'],'kein zweiter Bereich');
    /* Zwei Konten mit derselben E-Mail: nicht raten. */
    await f.store.setze('konten',{id:'doppelt',mail:'owner@example.test',name:'x',herkunft:'x',angelegt:'',gesperrt:0});
    assert.equal((await f.rufe('/konto/access',{method:'POST',headers:mit({Origin:SITE}),body:'{}'})).status,403);
  }finally{f.close();}
});

test('Der ganze Weg der App: Code → Freigabe auf der Website → Token → Hochladen',async()=>{
  const f=await fixture();try{
    const jwt=await nachweis();
    const web=await (await f.rufe('/konto/access',{method:'POST',headers:{...json({Origin:SITE}),'Cf-Access-Jwt-Assertion':jwt},body:'{}'})).json() as {token:string};
    const code=(await (await f.rufe('/konto/code',{method:'POST',headers:json({Origin:APP}),body:JSON.stringify({geraet:'Windows'})})).json() as {code:string}).code;
    assert.equal((await f.rufe('/konto/code-holen',{method:'POST',headers:json({Origin:APP}),body:JSON.stringify({code})})).status,202);
    /* Die Freigabe geht nur MIT Access (Website). */
    assert.equal((await f.rufe('/konto/code-freigeben',{method:'POST',headers:json({Authorization:'Bearer '+web.token}),body:JSON.stringify({code})})).status,403);
    const frei=await f.rufe('/konto/code-freigeben',{method:'POST',headers:{...json({Authorization:'Bearer '+web.token}),'Cf-Access-Jwt-Assertion':jwt},body:JSON.stringify({code})});
    assert.equal(frei.status,200);
    const app=await f.rufe('/konto/code-holen',{method:'POST',headers:json({Origin:APP}),body:JSON.stringify({code})});
    assert.equal(app.status,200);
    const appToken=(await app.json() as {token:string}).token;
    const satz={id:'b1',tabelle:'blocks',seite:'p1',daten:'VERSCHLUESSELT',verschluesselt:true,version:1,geaendert:new Date().toISOString(),geloescht:false};
    const hoch=await f.rufe('/sync/hoch',{method:'POST',headers:json({Origin:APP,Authorization:'Bearer '+appToken,'Redion-Geraet':'Windows'}),
      body:JSON.stringify({bereich:'ws_owner',saetze:[satz]})});
    assert.equal(hoch.status,200);assert.equal(hoch.headers.get('Access-Control-Allow-Origin'),APP);
    const zeile=f.sqlite.prepare("SELECT bereich, verschluesselt FROM saetze WHERE id='b1'").get() as {bereich:string;verschluesselt:number};
    assert.deepEqual({...zeile},{bereich:'ws_owner',verschluesselt:1});
  }finally{f.close();}
});
