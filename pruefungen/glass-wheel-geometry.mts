import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
const source=fs.readFileSync(path.resolve(import.meta.dirname,'../src/schale/bedienung/glass-wheel-geometry.ts'),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const context=vm.createContext({});vm.runInContext(code,context);
const math=vm.runInContext('GlassWheelGeometry',context);
for(const count of [0,1,3,8,20,64])for(const rotation of [-100000,-360,-44.2,0,90,99999]){
  const positions=math.positions(count,rotation) as Array<{index:number;angle:number}>;
  assert.equal(new Set(positions.map(position=>position.index)).size,positions.length);
  assert.ok(positions.every(position=>position.index>=0&&position.index<count&&Number.isFinite(position.angle)));
  assert.ok(positions.length<=8);
  assert.equal(math.wrap(0,count),count?0:-1);
  const settled=math.settle(rotation,10,count,true);
  assert.ok(Number.isFinite(settled));
  if(count>1)assert.ok(Math.abs(settled/math.step(count)-Math.round(settled/math.step(count)))<.001);
}
assert.equal(math.delta(179,-179),2);assert.equal(math.delta(-179,179),-2);
assert.equal(math.positions(0,0).length,0);assert.equal(math.positions(1,0).length,1);
assert.notEqual(math.settle(0,.4,8),math.settle(0,.4,8,true));
console.log('✓ 0/1/3/8/20/64 Bereiche, Winkelüberlauf, eindeutige Segmente, Einrasten und Bewegungsreduktion');
