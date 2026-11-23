/* RED ION native/live scheduler: synthetic app state, no external endpoints. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../quell/kern/abgleich/maschine.js',import.meta.url),'utf8');
type H={wolke:any;meta:Map<string,any>;intervals:Map<number,{fn:()=>void,ms:number}>;
  windows:Map<string,()=>void>;documents:Map<string,()=>void>;
  document:{hidden:boolean};navigator:{onLine:boolean};requests:string[];
  replies:Map<string,any>;store:any;writes:any[];files:Map<string,any>};

function app():H{
  const meta=new Map<string,any>([['wolkeAdresse','https://redion.example.test'],['wolkeBereich','ws_test']]);
  const intervals=new Map<number,{fn:()=>void,ms:number}>();
  const windows=new Map<string,()=>void>();
  const documents=new Map<string,()=>void>();
  const requests:string[]=[];
  const replies=new Map<string,any>(),writes:any[]=[],files=new Map<string,any>();
  let seq=0;
  const document={hidden:false,addEventListener:(event:string,fn:()=>void)=>{documents.set(event,fn);}};
  const navigator={onLine:true,userAgent:'iPhone',platform:'iPhone'};
  const host:any={addEventListener:(event:string,fn:()=>void)=>{windows.set(event,fn);}};
  const store:any={
    cache:{blocks:{},collections:{},views:{}},
    getMeta:(key:string,fallback:any)=>meta.has(key)?meta.get(key):fallback,
    setMeta:(key:string,value:any)=>meta.set(key,value),
    now:()=>new Date().toISOString(),
    on:()=>{},
    rohSetzen:(table:string,value:any)=>{writes.push({table,value});},
    basisPut:async()=>{},basisWeg:async()=>{},basisHolen:async()=>null,
    dateiHolen:async(id:string)=>files.get(id)??null,
    dateiAlle:async()=>[...files.values()],
    dateiPut:async(value:any)=>{files.set(value.id,value);},
    dateiWeg:async(id:string)=>{files.delete(id);},
    dateiGrabsteinWeg:()=>{},
    stueckeVon:async(id:string)=>id==='lokal'?[
      {id:'lokal:0',nr:0,blob:new Blob(['abc'],{type:'text/plain'})}
    ]:[],
    stueckPut:async()=>{},stueckWeg:async()=>{},
    getBlock:()=>null
  };
  vm.runInNewContext(source,{Store:store,window:host,location:{protocol:'capacitor:',origin:'null'},navigator,
    document,URL,crypto,TextEncoder,Uint8Array,Date,console,
    setTimeout:()=>0,
    setInterval:(fn:()=>void,ms:number)=>{const id=++seq;intervals.set(id,{fn,ms});return id;},
    clearInterval:(id:number)=>{intervals.delete(id);},
    fetch:async(input:string,init?:RequestInit)=>{
      requests.push(input);
      const path=new URL(input).pathname;
      const selected=replies.get(path);
      const value=typeof selected==='function'?selected(init):selected;
      const reply=value??{saetze:[],mehr:false,rolle:'voll',marke:''};
      return new Response(JSON.stringify(reply.payload??reply),
        {status:reply.status??200,headers:{'Content-Type':'application/json'}});
    },
    Bytes:{
      fromBase64:(v:string)=>new Uint8Array(Buffer.from(v,'base64')),
      toBase64:(v:Uint8Array)=>Buffer.from(v).toString('base64')
    },Blob,Response
  });
  return {wolke:host.Wolke,meta,intervals,windows,documents,document,navigator,
    requests,replies,store,writes,files};
}
const settled=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};

test('15-Sekunden-Live-Takt startet erst nach Anmeldung und ist einzeln',async()=>{
  const h=app();
  await h.wolke.start();
  assert.ok(h.windows.has('online'));
  assert.ok(h.documents.has('visibilitychange'));
  assert.equal(h.intervals.size,0,'Kein Hintergrund-Sync ohne Anmeldung');
  h.meta.set('wolkeToken','synthetic-token');
  assert.equal(h.wolke.taktSetzen('15'),15000);
  assert.deepEqual([...h.intervals.values()].map(x=>x.ms),[15000]);
  assert.equal(h.wolke.taktSetzen('120'),120000);
  assert.deepEqual([...h.intervals.values()].map(x=>x.ms),[120000],
    'Taktwechsel legt keinen zweiten Timer an');
  assert.equal(h.wolke.taktSetzen('15'),15000);
  assert.equal(h.wolke.taktSetzen('0'),0);
  assert.equal(h.intervals.size,0,'Manuell bedeutet kein Intervall');
});

test('Keine Anfrage wenn verborgen, offline oder Sync nicht freigegeben',async()=>{
  const h=app();
  await h.wolke.start();
  h.meta.set('wolkeToken','synthetic-token');
  h.meta.set('wolkeAbgleich',false);
  h.wolke.taktSetzen('15');
  const tick=[...h.intervals.values()][0]!.fn;
  tick();
  await settled();
  assert.equal(h.requests.length,0,'Anmeldung allein schaltet Sync nicht frei');
  h.meta.set('wolkeAbgleich',true);
  h.document.hidden=true;
  tick();await settled();
  assert.equal(h.requests.length,0,'Hintergrund darf keine Live-Abfrage auslösen');
  h.document.hidden=false;h.navigator.onLine=false;
  tick();await settled();
  assert.equal(h.requests.length,0,'Offline keine Live-Abfrage');
  h.navigator.onLine=true;
  tick();await settled();
  assert.ok(h.requests.some(x=>x.endsWith('/sync/runter')),
    'Bei Zustimmung holt der Live-Takt den bestehenden Sync-Delta-Endpunkt');
});

test('Beim Wiederöffnen und nach Netzrückkehr dieselben Sync-Schutzregeln',async()=>{
  const h=app();await h.wolke.start();
  h.meta.set('wolkeToken','synthetic-token');
  h.meta.set('wolkeAbgleich',false);
  h.documents.get('visibilitychange')!();
  h.windows.get('online')!();
  await settled();
  assert.equal(h.requests.length,0,'Kein Datenabgleich ohne Einwilligung');
});

test('Kanonische Block-ID: fremde Payload darf keinen anderen Block ersetzen',async()=>{
  const h=app();
  h.meta.set('wolkeToken','synthetic-token');
  h.replies.set('/sync/runter',{saetze:[
    {id:'erlaubt',tabelle:'blocks',version:2,
      daten:JSON.stringify({id:'fremdes_ziel',type:'text',text:'Angriff'}),verschluesselt:false},
    {id:'neu_mcp',tabelle:'blocks',version:1,
      daten:JSON.stringify({type:'page',text:'Neue MCP-Seite'}),verschluesselt:false}
  ],mehr:false,marke:'2026-11-23T19:20:00Z',rolle:'voll'});
  await h.wolke.runter();
  assert.equal(h.writes.length,1);
  assert.equal(h.writes[0].value.id,'neu_mcp');
  assert.equal(h.writes[0].value.text,'Neue MCP-Seite');
  assert.ok(!h.writes.some(x=>x.value.id==='fremdes_ziel'));
});

test('Fehlender Datei-Chunk blockiert weder andere Downloads noch den Upload',async()=>{
  const h=app();
  h.meta.set('wolkeToken','synthetic-token');
  h.files.set('lokal',{id:'lokal',name:'Meine Notiz',groesse:3,typ:'text/plain',
    zustand:'fertig',blockId:'page'});
  const datei=(id:string)=>({id,name:id,groesse:3,typ:'text/plain',
    teile:1,verschluesselt:false,geaendert:'2026-11-23T19:20:00Z'});
  h.replies.set('/datei/stand',{dateien:[datei('defekt'),datei('gesund')],
    marke:'2026-11-23T19:20:00Z',mehr:false});
  h.replies.set('/datei/runter',(init?:RequestInit)=>{
    const id=JSON.parse(String(init?.body)).dateiId;
    return id==='defekt'?{status:404,payload:{message:'Stück fehlt'}}:
      {nr:0,base64:Buffer.from('ok').toString('base64')};
  });
  h.replies.set('/datei/melden',{ok:true});
  h.replies.set('/datei/stueck',{ok:true});
  const result=await h.wolke.dateienAbgleichen();
  assert.equal(result?.dateienGeholt,1,'Der zweite Anhang bleibt lesbar');
  assert.equal(result?.dateienRauf,1,'Ein fremder Fehler hält den eigenen Upload nicht zurück');
  assert.ok(h.files.has('gesund'));
  const retry=h.meta.get('wolkeDateienWartend');
  assert.ok(Array.isArray(retry)&&retry.some((d:any)=>d.id==='defekt'));
  assert.equal(h.meta.get('wolkeMarkeDateien'),'2026-11-23T19:20:00Z');
  assert.ok(h.requests.some(x=>x.endsWith('/datei/stueck')));
});
