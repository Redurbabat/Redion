import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleCloudTools} from '../server/mcp/cloud-tools.ts';
import type {McpPrincipal} from '../server/mcp/oauth.ts';
import {readFileSync} from 'node:fs';
import {BUILTIN_BLOCK_TYPES} from '../server/mcp/block-catalog.ts';
import {BUILTIN_SYMBOLS} from '../server/mcp/symbol-catalog.ts';
import {editSchematic} from '../server/mcp/schematic-edit.ts';

const principal=(scopes:('redion:read'|'redion:write'|'redion:images')[]):McpPrincipal=>({
  userId:'test-user',clientId:'test-client',grantId:'test-grant',workspaceIds:['test-workspace'],scopes
});

test('Cloud MCP: new tools are scoped and have strict schemas',()=>{
  const read=visibleCloudTools(principal(['redion:read']));
  const write=visibleCloudTools(principal(['redion:read','redion:write']));
  const names=(items:typeof write)=>items.map(x=>x.name);
  assert.ok(names(read).includes('redion_list_child_pages'));
  assert.ok(names(read).includes('redion_list_root_pages'));
  assert.ok(names(read).includes('redion_read_pages'));
  assert.ok(!names(read).includes('redion_append_content'));
  assert.ok(!names(read).includes('redion_move_page'));
  assert.ok(names(write).includes('redion_list_child_pages'));
  assert.ok(names(write).includes('redion_list_root_pages'));
  assert.ok(names(write).includes('redion_read_pages'));
  assert.ok(names(write).includes('redion_append_content'));
  assert.ok(names(write).includes('redion_move_page'));
  for(const item of write){
    assert.equal(item.inputSchema.additionalProperties,false,item.name);
  }
  const readPages=write.find(x=>x.name==='redion_read_pages');
  assert.deepEqual(readPages?.inputSchema.required,['workspaceId','documentIds']);
  assert.deepEqual(readPages?.inputSchema.properties.documentIds,{
    type:'array',items:{type:'string',minLength:1,maxLength:128},minItems:1,maxItems:10
  });
  assert.deepEqual(readPages?.inputSchema.properties.maxChars,{type:'integer',minimum:1,maximum:2000});
  assert.equal(readPages?.annotations?.readOnlyHint,true);
  const breadcrumbs=write.find(x=>x.name==='redion_get_page_path');
  assert.ok(names(read).includes('redion_get_page_path'));
  assert.deepEqual(breadcrumbs?.inputSchema.required,['workspaceId','documentId']);
  assert.equal(breadcrumbs?.annotations?.readOnlyHint,true);
  const readPage=write.find(x=>x.name==='redion_read_page');
  assert.deepEqual(readPage?.inputSchema.properties.limit,{type:'integer',minimum:1,maximum:12000});
  assert.deepEqual(readPage?.inputSchema.properties.offset,{type:'integer',minimum:0});
  assert.deepEqual(readPage?.inputSchema.properties.expectedVersion,{type:'integer',minimum:1});
  assert.deepEqual(readPage?.inputSchema.properties.responseFormat,{
    type:'string',enum:['portable','legacy']
  });
  const search=write.find(x=>x.name==='redion_search');
  assert.deepEqual(search?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:1000});
  const schematic=write.find(x=>x.name==='redion_read_schematic');
  assert.ok(names(read).includes('redion_read_schematic'));
  assert.deepEqual(schematic?.inputSchema.required,['workspaceId','blockId']);
  assert.equal(schematic?.annotations?.readOnlyHint,true);
  const updateSchematic=write.find(x=>x.name==='redion_update_schematic');
  assert.equal(names(read).includes('redion_update_schematic'),false);
  assert.ok(names(write).includes('redion_update_schematic'));
  assert.deepEqual(updateSchematic?.inputSchema.required,
    ['workspaceId','blockId','expectedVersion','operation']);
  assert.deepEqual(updateSchematic?.inputSchema.properties.operation,
    {type:'string',enum:['add_component','connect_terminals','add_label','move_component','move_label']});
  assert.deepEqual(updateSchematic?.inputSchema.properties.rotation,
    {type:'integer',enum:[0,90,180,270]});
  assert.equal(updateSchematic?.annotations?.readOnlyHint,false);
  assert.equal(updateSchematic?.annotations?.idempotentHint,false);
  assert.equal(updateSchematic?.annotations?.destructiveHint,false);
  const addSchematic=write.find(x=>x.name==='redion_add_schematic');
  assert.equal(names(read).includes('redion_add_schematic'),false);
  assert.ok(names(write).includes('redion_add_schematic'));
  assert.deepEqual(addSchematic?.inputSchema.required,
    ['workspaceId','documentId','expectedVersion','art']);
  assert.equal(addSchematic?.annotations?.readOnlyHint,false);
  assert.equal(addSchematic?.annotations?.idempotentHint,true);
  assert.deepEqual((addSchematic?.inputSchema.properties.art as {enum:string[]}).enum,[
    'stromlauf-aufgeloest','stromlauf-zusammenhaengend','hauptstromkreis',
    'installationsplan','uebersichtsplan','klemmenplan','verdrahtungsplan',
    'anschlussplan','blockschaltbild','funktionsplan','aufbauplan'
  ]);
  const addBlock=write.find(x=>x.name==='redion_add_block');
  assert.equal(names(read).includes('redion_add_block'),false);
  assert.equal(names(write).includes('redion_add_block'),true);
  assert.deepEqual(addBlock?.inputSchema.required,['workspaceId','documentId','expectedVersion','typ']);
  assert.equal(addBlock?.inputSchema.properties.requestId&&
    (addBlock.inputSchema.properties.requestId as {minLength:number}).minLength,8);
  assert.equal(addBlock?.annotations?.readOnlyHint,false);
  assert.equal(addBlock?.annotations?.idempotentHint,true);
  assert.deepEqual((addBlock?.inputSchema.properties.typ as {enum:string[]})?.enum,
    ['text','h1','h2','h3','todo','bullet','number','quote','code','divider']);
  const pageBlocks=write.find(x=>x.name==='redion_list_page_blocks');
  assert.ok(names(read).includes('redion_list_page_blocks'));
  assert.ok(names(write).includes('redion_list_page_blocks'));
  assert.deepEqual(pageBlocks?.inputSchema.required,['workspaceId','documentId']);
  assert.deepEqual(pageBlocks?.inputSchema.properties.limit,{type:'integer',minimum:1,maximum:20});
  assert.deepEqual(pageBlocks?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:100000});
  assert.deepEqual(pageBlocks?.inputSchema.properties.expectedVersion,{type:'integer',minimum:1});
  assert.equal(pageBlocks?.annotations?.readOnlyHint,true);
  const readBlock=write.find(x=>x.name==='redion_read_block');
  assert.ok(names(read).includes('redion_read_block'));
  assert.ok(names(write).includes('redion_read_block'));
  assert.deepEqual(readBlock?.inputSchema.required,['workspaceId','blockId']);
  assert.equal(readBlock?.annotations?.readOnlyHint,true);
  const tasks=write.find(x=>x.name==='redion_list_tasks');
  assert.ok(names(read).includes('redion_list_tasks'));
  assert.ok(names(write).includes('redion_list_tasks'));
  assert.deepEqual(tasks?.inputSchema.required,['workspaceId']);
  assert.deepEqual(tasks?.inputSchema.properties.nurOffen,{type:'boolean'});
  assert.deepEqual(tasks?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:1000});
  assert.equal(tasks?.annotations?.readOnlyHint,true);
  const symbols=write.find(x=>x.name==='redion_list_symbols');
  assert.ok(names(read).includes('redion_list_symbols'));
  assert.equal(symbols?.annotations?.readOnlyHint,true);
  assert.deepEqual(symbols?.inputSchema.properties,{
    gruppe:{type:'string',maxLength:40},suche:{type:'string',maxLength:80}
  });
  const types=write.find(x=>x.name==='redion_list_block_types');
  assert.ok(names(read).includes('redion_list_block_types'));
  assert.deepEqual(types?.inputSchema.properties,{});
  assert.equal(types?.annotations?.readOnlyHint,true);
  const readDatabase=write.find(x=>x.name==='redion_read_database');
  assert.ok(names(read).includes('redion_read_database'));
  assert.ok(names(write).includes('redion_read_database'));
  assert.deepEqual(readDatabase?.inputSchema.required,['workspaceId','databaseId']);
  assert.deepEqual(readDatabase?.inputSchema.properties.limit,{type:'integer',minimum:1,maximum:10});
  assert.equal(readDatabase?.annotations?.readOnlyHint,true);
  const databases=write.find(x=>x.name==='redion_list_databases');
  assert.ok(names(read).includes('redion_list_databases'));
  assert.ok(names(write).includes('redion_list_databases'));
  assert.deepEqual(databases?.inputSchema.required,['workspaceId']);
  assert.deepEqual(databases?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:1000});
  assert.equal(databases?.annotations?.readOnlyHint,true);
  const rootList=write.find(x=>x.name==='redion_list_root_pages');
  assert.deepEqual(rootList?.inputSchema.required,['workspaceId']);
  assert.deepEqual(rootList?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:100000});
  assert.equal(rootList?.annotations?.readOnlyHint,true);
  const childList=write.find(x=>x.name==='redion_list_child_pages');
  assert.deepEqual(childList?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:100000});
  for(const item of read){
    assert.equal(item.annotations?.readOnlyHint,true,item.name);
    assert.equal(item.annotations?.openWorldHint,false,item.name);
    assert.ok(item.annotations?.title,item.name);
  }
  const create=write.find(x=>x.name==='redion_create_page');
  assert.equal(create?.annotations?.destructiveHint,false);
  assert.equal(create?.annotations?.idempotentHint,true);
  const append=write.find(x=>x.name==='redion_append_content');
  const move=write.find(x=>x.name==='redion_move_page');
  assert.deepEqual(append?.inputSchema.required,['workspaceId','documentId','content','expectedVersion']);
  assert.deepEqual(move?.inputSchema.required,['workspaceId','documentId','expectedVersion']);
  assert.equal(append?.annotations?.readOnlyHint,false);
  assert.equal(append?.annotations?.destructiveHint,false);
  assert.equal(move?.annotations?.readOnlyHint,false);
  assert.equal(move?.annotations?.destructiveHint,true);
});


test('Cloud MCP: der statische Blockkatalog stimmt mit dem Redion-Register überein',()=>{
  // src/register/bloecke.ts is the only authoring source for built-in types.
  // Catch UI/server drift without importing browser globals in the Worker.
  const source=readFileSync(new URL('../src/register/bloecke.ts',import.meta.url),'utf8');
  const list=(start:string)=>{
    const i=source.indexOf(start);
    assert.ok(i>=0,start);
    const j=source.indexOf('\n  ];',i);
    assert.ok(j>i,start);
    return source.slice(i,j+5);
  };
  const parse=(body:string,insertable:boolean)=>[...body.matchAll(
    /\{\s*id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?(?=\},|\}\s*\]|\}\s*;)/g
  )].filter(match=>!/\baktion:\s*'/.test(match[0]))
    .map(match=>({
      id:match[1],name:match[2],
      gruppe:match[0].match(/\bgruppe:\s*'([^']+)'/)?.[1]??'Intern',
      insertable
    }));
  const expected=[...parse(list('const EINGEBAUT = ['),true),
    ...parse(list('const NUR_NAME:'),false)];
  assert.equal(expected.length,56);
  assert.deepEqual(BUILTIN_BLOCK_TYPES,expected);
  assert.equal(BUILTIN_BLOCK_TYPES.some(x=>x.id==='a-del'),false);
  assert.ok(BUILTIN_BLOCK_TYPES.some(x=>x.id==='schaltplan'));
});


test('Cloud MCP: Fachzeichen-Metadaten stimmen mit dem kanonischen App-Register überein',()=>{
  const source=readFileSync(new URL('../src/register/fachzeichen.ts',import.meta.url),'utf8');
  const lines=source.split('\n');
  const indices:number[]=[];
  const symbolLine=/^\s*id:\s*'[^']+',\s*name:\s*'[^']+',\s*gruppe:\s*'[^']+',\s*kennbuchstabe:\s*'[^']*'/;
  for(let i=0;i<lines.length;i++)if(symbolLine.test(lines[i]!))indices.push(i);
  const expected=indices.map((start,index)=>{
    const body=lines.slice(start,indices[index+1]??lines.length).join('\n');
    const m=lines[start]!.match(/id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*gruppe:\s*'([^']+)',\s*kennbuchstabe:\s*'([^']*)'/);
    const size=body.match(/^\s*w:\s*(\d+),\s*h:\s*(\d+)/m);
    const terminals=body.match(/^\s*anschluesse:\s*\[([^\]]*)\]/m);
    assert.ok(m&&size&&terminals,'Metadaten fehlen bei Zeile '+(start+1));
    const anschluesse=[...terminals[1]!.matchAll(
      /\{\s*nr:\s*'([^']*)',\s*x:\s*(-?\d+),\s*y:\s*(-?\d+)\s*\}/g
    )].map(a=>({nr:a[1]!,x:Number(a[2]),y:Number(a[3])}));
    assert.equal(anschluesse.length,(terminals[1]!.match(/nr:\s*'/g)??[]).length);
    return {id:m[1]!,name:m[2]!,gruppe:m[3]!,kennbuchstabe:m[4]!,
      w:Number(size[1]),h:Number(size[2]),anschluesse};
  });
  assert.equal(expected.length,131);
  assert.equal(new Set(expected.map(s=>s.id)).size,expected.length);
  assert.deepEqual(BUILTIN_SYMBOLS,expected);
});


test('Cloud MCP: native Schaltpläne verschieben nur unverbundene Bauteile ohne Netzänderung',()=>{
  const base={art:'stromlauf-aufgeloest',breite:800,hoehe:700,
    teile:[] as any[],leitungen:[] as any[],texte:[] as any[],
    ebenen:[{id:'plan',name:'Plan',farbe:'var(--text)',sichtbar:true},
      {id:'aufgabe',name:'Aufgabe',farbe:'#c2410c',sichtbar:true},
      {id:'loesung',name:'Lösung',farbe:'#15803d',sichtbar:true}]};
  const invoke=(raw:unknown,operation:string,params:Record<string,unknown>)=>
    editSchematic(raw,{workspaceId:'ws_test',blockId:'schematic_unit',
      expectedVersion:1,operation,...params}).plan as typeof base;
  const add=(raw:unknown,componentId:string,x:number,y:number)=>
    invoke(raw,'add_component',{componentId,symbolId:'bp-sonnerie',x,y});
  let plan=add(base,'A',100,100);
  plan=add(plan,'B',300,100);
  const wirePlan=invoke(plan,'connect_terminals',{
    wireId:'wire_a_b',fromComponentId:'A',fromTerminal:'X1',
    toComponentId:'B',toTerminal:'X1'});
  assert.deepEqual(wirePlan.leitungen[0].punkte,[{x:130,y:100},{x:330,y:100}]);
  assert.throws(()=>invoke(wirePlan,'move_component',{componentId:'A',x:160,y:180}),
    /Leitungsanschlüsse/);
  const c=add(wirePlan,'C',200,0);
  const d=add(c,'D',200,240);
  assert.throws(()=>invoke(d,'connect_terminals',{
    wireId:'would_cross',fromComponentId:'C',fromTerminal:'X2',
    toComponentId:'D',toTerminal:'X1'}),/kreuzt oder berührt/);
  assert.throws(()=>add(d,'on_wire',200,100),/berührt eine vorhandene Leitung/);
  assert.throws(()=>invoke(d,'move_component',{componentId:'C',x:200,y:100}),
    /berührt eine vorhandene Leitung/);
  const moved=invoke(d,'move_component',{componentId:'C',x:240,y:360});
  assert.equal(moved.teile.find(x=>x.id==='C')?.x,240);
  assert.equal(moved.teile.find(x=>x.id==='C')?.y,360);
  assert.deepEqual(moved.leitungen,wirePlan.leitungen,
    'Bestehende Leitungskoordinaten dürfen beim Verschieben nicht verändert werden.');
  assert.deepEqual(d.teile.find(x=>x.id==='C')?.y,0,
    'Alte Planversion darf nicht mutieren.');
  assert.throws(()=>invoke(moved,'move_component',{componentId:'C',x:240,y:360}),
    /unverändert/);
  assert.throws(()=>invoke(moved,'move_component',{componentId:'C',x:791,y:10}),
    /Raster/);
  assert.throws(()=>invoke(moved,'move_component',{componentId:'C',x:780,y:650}),
    /ausserhalb des Planblatts/);
  const labelled=invoke(moved,'add_label',{
    labelId:'label_01',labelText:'Vor der Prüfung prüfen',x:100,y:300});
  const labelMoved=invoke(labelled,'move_label',{labelId:'label_01',x:150,y:330});
  assert.deepEqual(labelMoved.texte,[{id:'label_01',x:150,y:330,
    t:'Vor der Prüfung prüfen',ebene:'plan'}]);
  assert.deepEqual(labelled.texte[0],{id:'label_01',x:100,y:300,
    t:'Vor der Prüfung prüfen',ebene:'plan'});
  assert.throws(()=>invoke(labelMoved,'move_label',{
    labelId:'label_01',x:150,y:330}),/unverändert/);
  assert.throws(()=>invoke(labelMoved,'move_label',{
    labelId:'missing',x:150,y:330}),/existiert nicht/);
});
