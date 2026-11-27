import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeDatabase} from '../server/home/sqlite.ts';
import {openHomeBlobs} from '../server/home/blobs.ts';
import {openHomeServer} from '../server/home-server.ts';

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
