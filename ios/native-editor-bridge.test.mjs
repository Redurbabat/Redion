import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the exact JavaScript shipped inside the Swift/WKWebView bridge.
// Unlike textual grep checks, these run the actual permission and write logic.
const swift = fs.readFileSync(new URL('./native-editor.swift', import.meta.url), 'utf8');
function extract(name) {
  const re = new RegExp('private static let ' + name +
    ' = #"""\\n([\\s\\S]*?)\\n    """#');
  const match = swift.match(re);
  assert.ok(match, 'Swift bridge script not found: ' + name);
  return match[1];
}

function fixture(opts = {}) {
  const page = {id:'page', text:'My page', type:'page', alive:true, edited:'p-v1'};
  const block = {id:'block', text:'Original', type:opts.kind || 'text',
    alive:true, edited:'b-v1', content:[]};
  const order = [];
  const data = new Map([[page.id,page],[block.id,block]]);
  const store = {
    getBlock(id) { return data.get(id) ?? null; },
    cache: {blocks:Object.fromEntries(data)},
    childrenOf(id) { return id===page.id ? [block] : []; },
    speichertNicht() {return Boolean(opts.unavailable);},
    async versionSpeichern(id) {order.push('version');return {pageId:id};},
    updateBlock(id,patch) {order.push('write');Object.assign(data.get(id),patch,{edited:'b-v2'});},
    async flush() {order.push('flush');},
    async settled() {order.push('settled');}
  };
  const permissions = {darf:(mode,id)=>
    !(opts.readDenied && mode==='lesen') &&
    !(opts.editDenied && mode==='bearbeiten')};
  const context = {
    Store: store, Konten:permissions,
    window:{__redionNativeLibraryLoaded:!opts.locked},
    document:{getElementById:name=>opts.locked && name==='sperrschirm'?{}:null}
  };
  async function run(name,args) {
    const params = name==='readScript' ? ['pageId'] :
      ['pageId','blockId','expectedText','expectedEdited','replacement'];
    const f = vm.runInNewContext('(async function('+params.join(',')+'){'+extract(name)+'})',context);
    return await f(...params.map(p=>args[p]));
  }
  return {page,block,store,order,run};
}

test('native reader exposes only permitted metadata and direct plain-text blocks',async()=>{
  const x=fixture();
  const result=await x.run('readScript',{pageId:'page'});
  assert.equal(result.ok,true);
  assert.equal(result.title,'My page');
  assert.equal(result.blocks.length,1);
  assert.equal(result.blocks[0].canEdit,true);
  const denied=fixture({readDenied:true});
  assert.equal((await denied.run('readScript',{pageId:'page'})).ok,false);
  const locked=fixture({locked:true});
  assert.equal((await locked.run('readScript',{pageId:'page'})).ok,false);
});

test('native edit creates a prior version before writing and flushes to Store',async()=>{
  const x=fixture();
  const result=await x.run('writeScript',{
    pageId:'page',blockId:'block',
    expectedText:'Original',expectedEdited:'b-v1',replacement:'Changed'
  });
  assert.equal(result.ok,true);
  assert.equal(x.block.text,'Changed');
  assert.deepEqual(x.order,['version','write','flush','settled']);
});

test('stale or unauthorized edits never mutate stored blocks',async()=>{
  for(const opts of [{editDenied:true},{unavailable:true},{locked:true}]) {
    const x=fixture(opts);
    const result=await x.run('writeScript',{
      pageId:'page',blockId:'block',expectedText:'Original',
      expectedEdited:'b-v1',replacement:'Should not write'
    });
    assert.equal(result.ok,false);
    assert.equal(x.block.text,'Original');
    assert.deepEqual(x.order,[]);
  }
  const x=fixture();
  const mismatch=await x.run('writeScript',{
    pageId:'page',blockId:'block',expectedText:'Old',
    expectedEdited:'b-v1',replacement:'Bad'
  });
  assert.equal(mismatch.ok,false);
  assert.deepEqual(x.order,[]);
  const stale=await x.run('writeScript',{
    pageId:'page',blockId:'block',expectedText:'Original',
    expectedEdited:'not-current',replacement:'Bad'
  });
  assert.equal(stale.ok,false);
  assert.deepEqual(x.order,[]);
});

test('native editor refuses unsupported block types without touching their content',async()=>{
  const x=fixture({kind:'database'});
  const read=await x.run('readScript',{pageId:'page'});
  assert.equal(read.blocks[0].canEdit,false);
  assert.equal(read.blocks[0].text,'');
  const attempted=await x.run('writeScript',{
    pageId:'page',blockId:'block',expectedText:'Original',
    expectedEdited:'b-v1',replacement:'Cannot edit'
  });
  assert.equal(attempted.ok,false);
  assert.equal(x.block.text,'Original');
  assert.deepEqual(x.order,[]);
});
