import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeDatabase} from '../server/home/sqlite.ts';
import {openHomeBlobs} from '../server/home/blobs.ts';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';

test('Home SQLite persists across restart and rolls back failed batches',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-home-'));
  try{
    const first=openHomeDatabase(join(root,'data.sqlite'));
    try{
      await first.ablage.setze('konten',{id:'synthetic-owner',gesperrt:0});
      await assert.rejects(first.db.batch!([
        first.db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('rollback'),
        first.db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('synthetic-owner')
      ]));
      assert.equal(await first.ablage.hole('konten',{id:'rollback'}),null);
    }finally{first.close();}
    const second=openHomeDatabase(join(root,'data.sqlite'));
    try{assert.equal((await second.ablage.hole('konten',{id:'synthetic-owner'}))?.id,'synthetic-owner');}
    finally{second.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});
test('File chunks survive reopening and traversal strings cannot escape storage',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-blobs-'));
  try{
    const first=await openHomeBlobs(join(root,'blobs'));
    await first.lege('../../outside',new Uint8Array([1,2,3]));
    const second=await openHomeBlobs(join(root,'blobs'));
    assert.deepEqual(await second.hole('../../outside'),new Uint8Array([1,2,3]));
    await second.weg('../../outside');
    assert.equal(await first.hole('../../outside'),null);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('Private home API blocks public routes, foreign origins and anonymous sync',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-api-'));
  try{
    const origin='https://redion.example.test';
    const service=await openHomeServer({dataDir:root,origin});
    try{
      assert.equal((await service.handle(new Request(origin+'/api/stand'))).status,200);
      assert.equal((await service.handle(new Request(origin+'/sync/runter'))).status,401);
      assert.equal((await service.handle(new Request(origin+'/konto/oauth/github'))).status,404);
      assert.equal((await service.handle(new Request(origin+'/mcp/cloud'))).status,404);
      assert.equal((await service.handle(new Request(origin+'/server/schema.sql'))).status,404);
      assert.equal((await service.handle(new Request(origin+'/sync/runter',{headers:{Origin:'https://evil.example.test'}}))).status,403);
    }finally{service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Local device approval and claim are single-use across database connections',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-pair-'));
  try{
    const origin='https://redion.example.test';
    const service=await openHomeServer({dataDir:root,origin});
    const operator=openHomeDatabase(join(root,'redion.sqlite'));
    try{
      const post=(path:string,body:Record<string,unknown>)=>service.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'capacitor://localhost'},body:JSON.stringify(body)}));
      const created=await post('/konto/code',{geraet:'Test'});
      assert.equal(created.status,200);
      const {code}=await created.json() as {code:string};
      assert.equal((await post('/konto/code-holen',{code})).status,202);
      assert.equal((await post('/konto/code-freigeben',{code})).status,404);
      approveHomeDevice(operator.sqlite,code);
      assert.throws(()=>approveHomeDevice(operator.sqlite,code));
      const responses=await Promise.all([post('/konto/code-holen',{code}),post('/konto/code-holen',{code})]);
      assert.deepEqual(responses.map(r=>r.status).sort(),[200,404]);
      const success=responses.find(r=>r.status===200)!;
      const session=await success.json() as {token:string;bereiche:unknown[]};
      assert.equal(session.bereiche.length,1);
      assert.equal((await service.handle(new Request(origin+'/konto/ich',{headers:{Authorization:'Bearer '+session.token}}))).status,200);
      assert.equal(await service.store.ablage.zaehle('konten'),1);
      assert.equal(await service.store.ablage.zaehle('sitzungen'),1);
    }finally{operator.close();service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});
