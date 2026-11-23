/** Kanonische MCP-Werkzeugdefinitionen für den App-Connector.
 * Keine Remote-Abfrage, kein Token, keine produktiven Nutzerdaten.
 * Exportiert dieselben registrierten Definitionen, die tools/list liefert.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CLOUD_TOOLS,visibleCloudTools} from '../server/mcp/cloud-tools.ts';
import type {McpPrincipal} from '../server/mcp/oauth.ts';

const principal=(write:boolean):McpPrincipal=>({
  userId:'contract-only',clientId:'contract-only',grantId:'contract-only',
  workspaceIds:['synthetic-workspace'],
  scopes:write?['redion:read','redion:write']:['redion:read']
});

export const makeConnectorContract=()=>{
  const readOnly=visibleCloudTools(principal(false));
  const all=visibleCloudTools(principal(true));
  const readonlyNames=new Set(readOnly.map(t=>t.name));
  if(all.length!==CLOUD_TOOLS.length||
    all.some(t=>!CLOUD_TOOLS.some(c=>c.name===t.name)))
    throw new Error('MCP-Werkzeugregistrierung stimmt nicht mit tools/list überein.');
  if(all.some(t=>t.inputSchema.additionalProperties!==false))
    throw new Error('MCP-Werkzeug erlaubt unkontrollierte zusätzliche Felder.');
  if(readOnly.some(t=>t.annotations?.readOnlyHint!==true)||
    all.some(t=>!readonlyNames.has(t.name)&&t.annotations?.readOnlyHint!==false))
    throw new Error('OAuth-Zuordnung und MCP-Schreibkennzeichnung widersprechen sich.');
  const tools=all.map(t=>({
    name:t.name,description:t.description,
    oauthScope:readonlyNames.has(t.name)?'redion:read':'redion:write',
    inputSchema:t.inputSchema,annotations:t.annotations
  }));
  return {
    format:'redion.mcp.connector-contract.v1',
    source:'server/mcp/cloud-tools.ts',
    endpointPath:'/mcp/cloud',
    generatedLocally:true,
    containsCredentials:false,
    // Capture the real tool descriptions and schemas; the browser-based
    // App-Connector registry does NOT update itself just because GitHub changes.
    toolCount:tools.length,
    readonlyCount:readOnly.length,
    writeCount:tools.length-readOnly.length,
    tools
  };
};
const main=async()=>{
  const contract=JSON.stringify(makeConnectorContract(),null,2)+'\n';
  const args=process.argv.slice(2);
  if(args.length===0){process.stdout.write(contract);return;}
  if(args.length!==2||args[0]!=='--output'||!args[1])
    throw new Error('Aufruf: node skripte/mcp-connector-vertrag.mts [--output <pfad>]');
  const file=resolve(args[1]);
  await mkdir(dirname(file),{recursive:true});
  await writeFile(file,contract,'utf8');
  process.stdout.write('MCP-Vertrag erstellt: '+file+'\n');
};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  await main();
