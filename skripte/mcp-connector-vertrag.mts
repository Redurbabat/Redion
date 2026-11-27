/** Kanonische MCP-Werkzeugdefinitionen für den App-Connector.
 * Keine Remote-Abfrage, kein Token, keine produktiven Nutzerdaten.
 * Exportiert dieselben registrierten Definitionen, die tools/list liefert.
 */
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {CLOUD_TOOLS,visibleCloudTools} from '../server/mcp/cloud-tools.ts';
import type {McpPrincipal} from '../server/mcp/oauth.ts';
import {canonicalMcpJson,CLOUD_MCP_SERVER_INFO} from '../server/mcp/contract-meta.ts';

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
    serverInfo:CLOUD_MCP_SERVER_INFO,
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
// Compare a saved connector contract or a complete MCP tools/list response.
// No credentials or remote calls are required, and raw input is never printed.
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function compareConnectorContract(snapshot:unknown,write=true){
  const payload=object(snapshot)&&object(snapshot.result)?snapshot.result:snapshot;
  const tools=Array.isArray(payload)?payload:object(payload)?payload.tools:undefined;
  if(!Array.isArray(tools)||tools.length>500||
    (object(payload)&&payload.nextCursor!=null))
    throw new Error('Vollständige, unpaginierte Werkzeugliste erforderlich.');
  const byName=new Map<string,Record<string,unknown>>();
  for(const t of tools){
    if(!object(t)||typeof t.name!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(t.name)||
      !object(t.inputSchema)||byName.has(t.name))
      throw new Error('Ungültige oder doppelte Werkzeugdefinition.');
    byName.set(t.name,t);
  }
  const expected=makeConnectorContract().tools.filter(t=>write||t.oauthScope==='redion:read');
  const names=new Set(expected.map(t=>t.name));
  const missing=expected.filter(t=>!byName.has(t.name)).map(t=>t.name).sort();
  const unexpected=[...byName.keys()].filter(n=>!names.has(n)).sort();
  const changed=expected.flatMap(t=>{
    const actual=byName.get(t.name);
    if(!actual)return [];
    const fields=['description','inputSchema','annotations'].filter(k=>
      canonicalMcpJson(actual[k])!==canonicalMcpJson((t as unknown as Record<string,unknown>)[k]));
    if(Object.hasOwn(actual,'oauthScope')&&actual.oauthScope!==t.oauthScope)fields.push('oauthScope');
    return fields.length?[{name:t.name,fields}]:[];
  });
  return {matches:!missing.length&&!unexpected.length&&!changed.length,
    scope:write?'read-write':'read-only',expectedCount:expected.length,
    actualCount:byName.size,missing,unexpected,changed};
}
const main=async()=>{
  const contract=JSON.stringify(makeConnectorContract(),null,2)+'\n';
  const args=process.argv.slice(2);
  if(args[0]==='--compare'&&(args.length===2||args.length===3&&args[2]==='--read-only')&&args[1]){
    const info=await stat(args[1]);
    if(!info.isFile()||info.size>2_000_000)throw new Error('Werkzeugliste muss eine JSON-Datei bis 2 MB sein.');
    let snapshot:unknown;
    try{snapshot=JSON.parse(await readFile(args[1],'utf8'));}
    catch{throw new Error('Werkzeugliste ist kein lesbares JSON.');}
    const report=compareConnectorContract(snapshot,args[2]!=='--read-only');
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(!report.matches)process.exitCode=1;
    return;
  }
  if(args.length===0){process.stdout.write(contract);return;}
  if(args.length!==2||args[0]!=='--output'||!args[1])
    throw new Error('Aufruf: node skripte/mcp-connector-vertrag.mts [--output <pfad> | --compare <pfad> [--read-only]]');
  const file=resolve(args[1]);
  await mkdir(dirname(file),{recursive:true});
  await writeFile(file,contract,'utf8');
  process.stdout.write('MCP-Vertrag erstellt: '+file+'\n');
};
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  await main();
