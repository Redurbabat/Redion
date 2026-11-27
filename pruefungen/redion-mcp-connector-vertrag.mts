import test from 'node:test';
import assert from 'node:assert/strict';
import {makeConnectorContract,compareConnectorContract} from '../skripte/mcp-connector-vertrag.mts';
import {visibleCloudTools} from '../server/mcp/cloud-tools.ts';
import type {McpPrincipal} from '../server/mcp/oauth.ts';

const names=(items:{name:string}[])=>items.map(t=>t.name);
const principal=(write:boolean):McpPrincipal=>({
  userId:'audit-only',clientId:'audit-only',grantId:'audit-only',
  workspaceIds:['synthetic-workspace'],
  scopes:write?['redion:read','redion:write']:['redion:read']
});

test('V07-Connector: Export stimmt exakt mit aktuellem Cloud-MCP tools/list überein',()=>{
  const contract=makeConnectorContract();
  const full=visibleCloudTools(principal(true));
  const read=visibleCloudTools(principal(false));
  assert.equal(contract.format,'redion.mcp.connector-contract.v1');
  assert.equal(contract.endpointPath,'/mcp/cloud');
  assert.equal(contract.containsCredentials,false);
  assert.deepEqual(contract.serverInfo,{name:'RED ION Cloud MCP',version:'1.1.0'});
  assert.equal(contract.toolCount,33);
  assert.equal(contract.readonlyCount,17);
  assert.equal(contract.writeCount,16);
  assert.deepEqual(names(contract.tools),names(full));
  assert.equal(new Set(names(contract.tools)).size,contract.tools.length);
  assert.deepEqual(contract.tools.map(t=>({
    name:t.name,description:t.description,
    inputSchema:t.inputSchema,annotations:t.annotations
  })),full);
  assert.deepEqual(contract.tools.filter(t=>t.oauthScope==='redion:read').map(t=>t.name),
    names(read));
  for(const item of contract.tools){
    assert.equal(item.inputSchema.additionalProperties,false,item.name);
    assert.equal(item.annotations?.readOnlyHint,item.oauthScope==='redion:read',item.name);
    for(const key of item.inputSchema.required??[])
      assert.ok(Object.hasOwn(item.inputSchema.properties,key),item.name+' '+key);
  }
});

test('V07-Connector: veraltete Toolnamen und gefährliche Rohdatenfelder nicht exportieren',()=>{
  const contract=makeConnectorContract();
  for(const old of ['redion_trash_page','redion_create_database','redion_add_rows',
    'redion_update_row','redion_add_task','redion_add_event']){
    assert.ok(!names(contract.tools).includes(old),old);
  }
  for(const expected of ['redion_get_page_path','redion_read_pages',
    'redion_list_page_blocks','redion_list_root_pages','redion_list_child_pages'])
    assert.ok(names(contract.tools).includes(expected),expected);
  const block=contract.tools.find(t=>t.name==='redion_update_block')!;
  assert.equal(block.oauthScope,'redion:write');
  assert.deepEqual(block.inputSchema.required,
    ['workspaceId','blockId','expectedVersion','operation']);
  assert.ok(!Object.hasOwn(block.inputSchema.properties,'ersetzen'));
  assert.ok(!Object.hasOwn(block.inputSchema.properties,'papierkorb'));
  assert.ok(!Object.hasOwn(block.inputSchema.properties,'daten'));
  const diagram=contract.tools.find(t=>t.name==='redion_add_schematic')!;
  assert.deepEqual(diagram.inputSchema.required,
    ['workspaceId','documentId','expectedVersion','art']);
  assert.ok(!Object.hasOwn(diagram.inputSchema.properties,'teile'));
  assert.ok(!Object.hasOwn(diagram.inputSchema.properties,'verbindungen'));
  const paging=contract.tools.find(t=>t.name==='redion_read_page')!;
  assert.ok(Object.hasOwn(paging.inputSchema.properties,'blockOffset'));
  assert.ok(Object.hasOwn(paging.inputSchema.properties,'blockLimit'));
  const database=contract.tools.find(t=>t.name==='redion_read_database')!;
  assert.deepEqual(database.inputSchema.properties.limit,
    {type:'integer',minimum:1,maximum:500});
  assert.ok(Object.hasOwn(database.inputSchema.properties,'offset'));
});

test('V07-Connector: JSON-Datei ist deterministisch und ohne Kontodaten',()=>{
  const first=JSON.stringify(makeConnectorContract());
  const second=JSON.stringify(makeConnectorContract());
  assert.equal(first,second);
  assert.ok(!first.includes('access_token'));
  assert.ok(!first.includes('client_secret'));
  assert.ok(!first.includes('refresh_token'));
  assert.equal(JSON.parse(first).tools.length,33);
});


test('V07-Connector: identische Werkzeuglisten und read-only Scope erkennen',()=>{
  const contract=makeConnectorContract();
  assert.deepEqual(compareConnectorContract(contract),{
    matches:true,scope:'read-write',expectedCount:32,actualCount:32,
    missing:[],unexpected:[],changed:[]});
  const tools=visibleCloudTools(principal(false));
  assert.equal(compareConnectorContract({jsonrpc:'2.0',id:1,result:{tools}},false).matches,true);
  assert.equal(compareConnectorContract({tools},true).missing.length,16);
  assert.equal(compareConnectorContract({tools:[...contract.tools].reverse()}).matches,true);
});

test('V07-Connector: fehlende Aktionen, alte Schemas und Berechtigungsabweichungen erkennen',()=>{
  const contract=makeConnectorContract();
  const tools=structuredClone(contract.tools) as any[];
  const tool=tools.find(t=>t.name==='redion_update_schematic')!;
  tool.inputSchema.properties.operation.enum=['add_component','connect_terminals','add_label','move_component','move_label'];
  tool.annotations.destructiveHint=false;
  tool.oauthScope='redion:read';
  const i=tools.findIndex(t=>t.name==='redion_list_child_pages');
  tools.splice(i,1);
  tools.push({name:'old_tool',inputSchema:{type:'object'}});
  const report=compareConnectorContract({tools});
  assert.equal(report.matches,false);
  assert.deepEqual(report.missing,['redion_list_child_pages']);
  assert.deepEqual(report.unexpected,['old_tool']);
  assert.deepEqual(report.changed,[{name:'redion_update_schematic',fields:['inputSchema','annotations','oauthScope']}]);
  assert.equal(compareConnectorContract(contract).matches,true);
});

test('V07-Connector: JSON-Objektreihenfolge egal, ungültige oder unvollständige Exporte abgelehnt',()=>{
  const tools=makeConnectorContract().tools;
  const reversed=tools.map(t=>Object.fromEntries(Object.entries(t).reverse()));
  assert.equal(compareConnectorContract(reversed).matches,true);
  assert.throws(()=>compareConnectorContract({tools,nextCursor:'more'}));
  assert.throws(()=>compareConnectorContract({tools:[tools[0],tools[0]]}));
  assert.throws(()=>compareConnectorContract({tools:[{name:'bad',inputSchema:null}]}));
  assert.throws(()=>compareConnectorContract({}));
  assert.throws(()=>compareConnectorContract({tools:Array(501).fill(tools[0])}));
});
