/* RED ION native/live scheduler: synthetic app state, no external endpoints. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../quell/kern/abgleich/maschine.js',import.meta.url),'utf8');
type H={wolke:any;meta:Map<string,any>;intervals:Map<number,{fn:()=>void,ms:number}>;
  windows:Map<string,()=>void>;documents:Map<string,()=>void>;
  document:{hidden:boolean};navigator:{onLine:boolean};requests:string[]};

function app():H{
  const meta=new Map<string,any>([['wolkeAdresse','https://redion.example.test'],['wolkeBereich','ws_test']]);
  const intervals=new Map<number,{fn:()=>void,ms:number}>();
  const windows=new Map<string,()=>void>();
  const documents=new Map<string,()=>void>();
  const requests:string[]=[];
  let seq=0;
  const document={hidden:false,addEventListener:(event:string,fn:()=>void)=>{documents.set(event,fn);}};
  const navigator={onLine:true,userAgent:'iPhone',platform:'iPhone'};
  const host:any={addEventListener:(event:string,fn:()=>void)=>{windows.set(event,fn);}};
  const store:any={
    cache:{blocks:{},collections:{},views:{}},
    getMeta:(key:string,fallback:any)=>meta.has(key)?meta.get(key):fallback,
    setMeta:(key:string,value:any)=>meta.set(key,value),
    now:()=>new Date().toISOString(),
    on:()=>{}
  };
  vm.runInNewContext(source,{Store:store,window:host,location:{protocol:'capacitor:',origin:'null'},navigator,
    document,URL,crypto,TextEncoder,Uint8Array,Date,console,
    setTimeout:()=>0,
    setInterval:(fn:()=>void,ms:number)=>{const id=++seq;intervals.set(id,{fn,ms});return id;},
    clearInterval:(id:number)=>{intervals.delete(id);},
    fetch:async(input:string)=>{requests.push(input);return new Response(
      JSON.stringify({saetze:[],mehr:false,rolle:'voll',marke:''}),
      {status:200,headers:{'Content-Type':'application/json'}});},
    Response
  });
  return {wolke:host.Wolke,meta,intervals,windows,documents,document,navigator,requests};
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
