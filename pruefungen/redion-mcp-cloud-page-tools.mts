import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleCloudTools} from '../server/mcp/cloud-tools.ts';
import type {McpPrincipal} from '../server/mcp/oauth.ts';

const principal=(scopes:('redion:read'|'redion:write'|'redion:images')[]):McpPrincipal=>({
  userId:'test-user',clientId:'test-client',grantId:'test-grant',workspaceIds:['test-workspace'],scopes
});

test('Cloud MCP: new tools are scoped and have strict schemas',()=>{
  const read=visibleCloudTools(principal(['redion:read']));
  const write=visibleCloudTools(principal(['redion:read','redion:write']));
  const names=(items:typeof write)=>items.map(x=>x.name);
  assert.ok(names(read).includes('redion_list_child_pages'));
  assert.ok(!names(read).includes('redion_append_content'));
  assert.ok(!names(read).includes('redion_move_page'));
  assert.ok(names(write).includes('redion_list_child_pages'));
  assert.ok(names(write).includes('redion_append_content'));
  assert.ok(names(write).includes('redion_move_page'));
  for(const item of write){
    assert.equal(item.inputSchema.additionalProperties,false,item.name);
  }
  const append=write.find(x=>x.name==='redion_append_content');
  const move=write.find(x=>x.name==='redion_move_page');
  assert.deepEqual(append?.inputSchema.required,['workspaceId','documentId','content','expectedVersion']);
  assert.deepEqual(move?.inputSchema.required,['workspaceId','documentId','expectedVersion']);
});
