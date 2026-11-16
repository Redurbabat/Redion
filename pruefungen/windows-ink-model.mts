import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Dieselben erzeugten Skripte wie die Offline-App, ohne Benutzerdaten.
const root = path.resolve(import.meta.dirname, '..');
const context = vm.createContext({ console });
vm.runInContext('globalThis.window = globalThis;', context);
for (const file of ['core/ink/geometry', 'core/ink/stroke', 'bereiche/bloecke/arten/schaltplan'])
  vm.runInContext(fs.readFileSync(path.join(root, 'quell', file + '.js'), 'utf8'), context);
const run = (code: string): any => JSON.parse(JSON.stringify(vm.runInContext(code, context)));

test('Gesammelte Stiftpunkte schliessen die aktuelle Meldung ein, ohne sie zu verdoppeln', () => {
  assert.deepEqual(run(`InkStroke.samples({clientX:3,clientY:4,timeStamp:8,pressure:.7,
    getCoalescedEvents:()=>[{clientX:1,clientY:2,timeStamp:4,pressure:.4}]}).map(e=>e.clientX)`), [1, 3]);
  assert.equal(run(`InkStroke.samples({clientX:3,clientY:4,timeStamp:8,pressure:.7,
    getCoalescedEvents:()=>[{clientX:3,clientY:4,timeStamp:8,pressure:.7}]}).length`), 1);
});

test('Alte Plaene bleiben ohne neues Freihandfeld; neue Daten ueberleben Lesen und SVG', () => {
  assert.equal(run(`'ink' in Schaltplan.lesen({plan:Schaltplan.neuerPlan()})`), false);
  const result = run(`(() => {
    const plan=Schaltplan.neuerPlan();
    plan.ink=[{id:'note',art:'stift',pts:[[10.25,20.75],[30.5,40.25]],
      pressure:[.2,.8],neigung:[.1,.5],farbe:'#529cca',breite:2.4,ebene:'plan'}];
    const read=Schaltplan.lesen({plan:JSON.parse(JSON.stringify(plan))});
    return {original:plan.ink,read:read.ink,svg:Schaltplan.alsSvg(read,{raster:false})};
  })()`);
  assert.deepEqual(result.read, result.original);
  assert.match(result.svg, /data-ink="note"/);
  assert.doesNotMatch(result.svg, /NaN|undefined/);
});

test('Freihand-Ebenen und Beschriftungen koennen kein SVG einschleusen', () => {
  const svg = run(`(() => {
    const plan=Schaltplan.neuerPlan();
    plan.ink=[{id:'<bad>',art:'stift',pts:[[1,2],[3,4]],farbe:'red" onload="bad',breite:2,ebene:'plan'}];
    return Schaltplan.alsSvg(Schaltplan.lesen({plan}),{raster:false});
  })()`);
  assert.doesNotMatch(svg, /onload=|<bad>/);
  assert.match(svg, /data-ink=/);
});

test('Ausgeblendete Freihand wird nicht exportiert', () => {
  assert.equal(run(`(() => {
    const plan=Schaltplan.neuerPlan();
    plan.ebenen.push({id:'hidden',name:'Lösung',farbe:'#529cca',sichtbar:false});
    plan.ink=[{id:'hidden-note',art:'stift',pts:[[1,2],[3,4]],farbe:'#529cca',breite:2,ebene:'hidden'}];
    return Schaltplan.alsSvg(plan,{raster:false}).includes('data-ink');
  })()`), false);
});

test('PDF und Plan verwenden denselben normierten Neigungskanal', () => {
  assert.equal(run(`InkStroke.tiltOf({pointerType:'pen',tiltX:45,tiltY:0})`), .5);
  assert.equal(run(`InkStroke.tiltOf({pointerType:'pen',tiltX:45,tiltY:45})`), .61);
  assert.equal(run(`InkStroke.tiltOf({pointerType:'pen',tiltX:0,tiltY:0})`), -1);
  assert.equal(run(`InkStroke.tiltOf({pointerType:'mouse',tiltX:45,tiltY:0})`), -1);
});

test('Drehen des Blattes nimmt Freihand mit, ohne sie auf das Elektroraster zu runden', () => {
  const result = run(`(() => {
    const plan=Schaltplan.neuerPlan();plan.breite=800;plan.hoehe=500;
    plan.ink=[{id:'note',art:'stift',pts:[[10.25,20.75],[30.5,40.25]],pressure:[.2,.8],farbe:'#529cca',breite:2.4,ebene:'plan'}];
    Schaltplan.planDrehen(plan);return {pts:plan.ink[0].pts,pressure:plan.ink[0].pressure,width:plan.breite,height:plan.hoehe};
  })()`);
  assert.deepEqual(result, { pts: [[479.25, 10.25], [459.75, 30.5]], pressure: [.2, .8], width: 500, height: 800 });
});
