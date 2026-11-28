import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assessStorageCapacity,reviewStorageCapacity} from '../server/home/maintenance-storage.ts';
test('capacity thresholds use unrounded ratios',()=>{
 for(const [n,status] of [[151,'ok'],[150,'warning'],[51,'warning'],[50,'critical'],[0,'critical']] as const)assert.equal(assessStorageCapacity(1000,n).status,status);
});
test('invalid measurements never report healthy storage',()=>{
 for(const [total,free] of [[0,0],[-1,0],[100,-1],[100,101],[Infinity,0],[100,NaN],[Number.MAX_SAFE_INTEGER+1,0]])assert.equal(assessStorageCapacity(total!,free!).status,'unknown');
});
test('missing directory reports unknown without leaking filesystem path',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-storage-review-'));
 try{const r=await reviewStorageCapacity(join(root,'absent'));assert.equal(r.status,'unknown');assert.equal(r.reason,'unavailable');assert.ok(!JSON.stringify(r).includes(root));}finally{await rm(root,{recursive:true,force:true});}
});
test('real filesystem probe yields bounded capacity',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-storage-review-'));
 try{const r=await reviewStorageCapacity(root);assert.notEqual(r.status,'unknown');assert.ok(r.availablePercent!==null&&r.availablePercent>=0&&r.availablePercent<=100);}finally{await rm(root,{recursive:true,force:true});}
});
