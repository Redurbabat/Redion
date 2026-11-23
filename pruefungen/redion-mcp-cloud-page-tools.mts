import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleCloudTools} from '../server/mcp/cloud-tools.ts';
import type {McpPrincipal} from '../server/mcp/oauth.ts';
import {readFileSync} from 'node:fs';
import {BUILTIN_BLOCK_TYPES} from '../server/mcp/block-catalog.ts';

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
  const tasks=write.find(x=>x.name==='redion_list_tasks');
  assert.ok(names(read).includes('redion_list_tasks'));
  assert.ok(names(write).includes('redion_list_tasks'));
  assert.deepEqual(tasks?.inputSchema.required,['workspaceId']);
  assert.deepEqual(tasks?.inputSchema.properties.nurOffen,{type:'boolean'});
  assert.deepEqual(tasks?.inputSchema.properties.offset,{type:'integer',minimum:0,maximum:1000});
  assert.equal(tasks?.annotations?.readOnlyHint,true);
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
